import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventTargets from 'aws-cdk-lib/aws-events-targets';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

/**
 * EventStack  —  Phase 6 Event-Driven Order Processing
 *
 * Architecture:
 *   EcommerceEventBus (EventBridge custom bus)
 *     └── Rule: OrderCreated → OrderQueue (SQS)
 *
 *   OrderQueue (SQS)  ← maxReceiveCount=3
 *     └── OrderProcessorFunction (ARM64, Node 22)
 *           ├── Update DynamoDB status
 *           └── Publish: OrderProcessing / OrderCompleted / OrderFailed
 *
 *   OrderDLQ (SQS)  ← receives messages after 3 failed attempts
 *
 * Cross-stack imports (Fn.importValue — no CDK graph dependency):
 *   EcommerceTableName  ← DatabaseStack
 *   EcommerceTableArn   ← DatabaseStack
 *
 * Exports:
 *   EcommerceEventBusName
 *   EcommerceEventBusArn    ← consumed by ApiStack to publish OrderCreated
 *   EcommerceOrderQueueUrl
 *   EcommerceOrderDLQUrl
 */
export class EventStack extends cdk.Stack {
    public readonly eventBus: events.EventBus;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // ─────────────────────────────────────────────────────────────────
        // Cross-stack imports — no CDK object refs, deploys independently
        // ─────────────────────────────────────────────────────────────────
        const tableName = cdk.Fn.importValue('EcommerceTableName');
        const tableArn = cdk.Fn.importValue('EcommerceTableArn');

        // ─────────────────────────────────────────────────────────────────
        // OrderDLQ — receives messages after maxReceiveCount failures
        // ─────────────────────────────────────────────────────────────────
        const orderDLQ = new sqs.Queue(this, 'OrderDLQ', {
            queueName: 'EcommerceOrderDLQ',
            retentionPeriod: cdk.Duration.days(14),
            encryption: sqs.QueueEncryption.SQS_MANAGED,
        });

        // ─────────────────────────────────────────────────────────────────
        // OrderQueue — primary processing queue
        //   visibilityTimeout = 6× Lambda timeout = 6×30s = 180s (AWS best practice)
        //   retentionPeriod   = 4 days (requirement)
        //   maxReceiveCount   = 3 (before routing to DLQ)
        // ─────────────────────────────────────────────────────────────────
        const orderQueue = new sqs.Queue(this, 'OrderQueue', {
            queueName: 'EcommerceOrderQueue',
            visibilityTimeout: cdk.Duration.seconds(180),    // 6× Lambda timeout (30s)
            retentionPeriod: cdk.Duration.days(4),
            encryption: sqs.QueueEncryption.SQS_MANAGED,
            deadLetterQueue: {
                queue: orderDLQ,
                maxReceiveCount: 3,
            },
        });

        // ─────────────────────────────────────────────────────────────────
        // EcommerceEventBus — custom EventBridge bus
        // ─────────────────────────────────────────────────────────────────
        this.eventBus = new events.EventBus(this, 'EcommerceEventBus', {
            eventBusName: 'EcommerceEventBus',
        });

        // ─────────────────────────────────────────────────────────────────
        // EventBridge Rule — route OrderCreated events → OrderQueue
        //
        // Hardening: SqsQueue target uses orderDLQ as the delivery DLQ so
        // that EventBridge delivery failures (e.g. SQS unavailable) do not
        // silently drop events.
        // ─────────────────────────────────────────────────────────────────
        new events.Rule(this, 'OrderCreatedRule', {
            eventBus: this.eventBus,
            ruleName: 'EcommerceOrderCreatedRule',
            description: 'Route OrderCreated events to the OrderQueue for async processing',
            eventPattern: {
                source: ['ecommerce.orders'],
                detailType: ['OrderCreated'],
            },
            targets: [
                new eventTargets.SqsQueue(orderQueue, {
                    deadLetterQueue: orderDLQ,   // EventBridge delivery failures → DLQ
                }),
            ],
        });

        // ─────────────────────────────────────────────────────────────────
        // OrderProcessorFunction
        //   Runtime:  Node.js 22.x  ARM64  512 MB  30s timeout
        //   Triggered by: SQS (OrderQueue)
        // ─────────────────────────────────────────────────────────────────

        // Explicit log group — avoids deprecated logRetention prop
        const orderProcessorLogGroup = new logs.LogGroup(this, 'OrderProcessorLogs', {
            logGroupName: '/aws/lambda/OrderProcessorFunction',
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const orderProcessorFn = new lambdaNodejs.NodejsFunction(
            this,
            'OrderProcessorFunction',
            {
                functionName: 'OrderProcessorFunction',
                description: 'Phase 6 — async order processing via SQS/EventBridge',
                runtime: lambda.Runtime.NODEJS_22_X,
                architecture: lambda.Architecture.ARM_64,
                memorySize: 512,
                timeout: cdk.Duration.seconds(30),
                entry: path.join(
                    __dirname,
                    '../src/lambda/order-processor/index.ts',
                ),
                handler: 'handler',
                environment: {
                    TABLE_NAME: tableName,
                    EVENT_BUS_NAME: 'EcommerceEventBus',
                    NODE_OPTIONS: '--enable-source-maps',
                },
                bundling: {
                    minify: true,
                    sourceMap: true,
                    target: 'node22',
                    forceDockerBundling: false,  // use local esbuild — no Docker required
                },
                tracing: lambda.Tracing.ACTIVE,   // X-Ray — Phase 6 hardening
                logGroup: orderProcessorLogGroup,
            },
        );

        // ── IAM: DynamoDB least-privilege ──────────────────────────────────────
        // GetItem    — read order before status transition (idempotency check)
        // UpdateItem — write PROCESSING / COMPLETED / FAILED status
        // Query is NOT granted — processor uses only point reads and writes
        orderProcessorFn.addToRolePolicy(
            new iam.PolicyStatement({
                sid: 'OrderProcessorDynamo',
                effect: iam.Effect.ALLOW,
                actions: [
                    'dynamodb:GetItem',
                    'dynamodb:UpdateItem',
                ],
                resources: [tableArn],
            }),
        );

        // ── IAM: EventBridge least-privilege ──────────────────────────────────
        orderProcessorFn.addToRolePolicy(
            new iam.PolicyStatement({
                sid: 'OrderProcessorEventBridge',
                effect: iam.Effect.ALLOW,
                actions: ['events:PutEvents'],
                resources: [this.eventBus.eventBusArn],
            }),
        );

        // ── SQS trigger ───────────────────────────────────────────────────────
        // batchSize=1 ensures each order is processed independently.
        // bisectBatchOnFunctionError=true: on failure, Lambda bisects the
        // batch to isolate the bad record before routing to DLQ.
        orderProcessorFn.addEventSource(
            new lambdaEventSources.SqsEventSource(orderQueue, {
                batchSize: 1,
                reportBatchItemFailures: true,
            }),
        );

        // ─────────────────────────────────────────────────────────────────
        // Outputs — consumed by ApiStack and MonitoringStack
        // ─────────────────────────────────────────────────────────────────
        new cdk.CfnOutput(this, 'EventBusName', {
            value: this.eventBus.eventBusName,
            description: 'EcommerceEventBus name',
            exportName: 'EcommerceEventBusName',
        });

        new cdk.CfnOutput(this, 'EventBusArn', {
            value: this.eventBus.eventBusArn,
            description: 'EcommerceEventBus ARN — used by ApiStack to PutEvents',
            exportName: 'EcommerceEventBusArn',
        });

        new cdk.CfnOutput(this, 'OrderQueueUrl', {
            value: orderQueue.queueUrl,
            description: 'Primary order processing queue URL',
            exportName: 'EcommerceOrderQueueUrl',
        });

        new cdk.CfnOutput(this, 'OrderDLQUrl', {
            value: orderDLQ.queueUrl,
            description: 'Dead-letter queue URL for failed order processing',
            exportName: 'EcommerceOrderDLQUrl',
        });

        // Surface queue names for MonitoringStack
        new cdk.CfnOutput(this, 'OrderQueueName', {
            value: orderQueue.queueName,
            exportName: 'EcommerceOrderQueueName',
        });

        new cdk.CfnOutput(this, 'OrderDLQName', {
            value: orderDLQ.queueName,
            exportName: 'EcommerceOrderDLQName',
        });

        new cdk.CfnOutput(this, 'OrderProcessorFunctionName', {
            value: orderProcessorFn.functionName,
            exportName: 'EcommerceOrderProcessorFunctionName',
        });

        cdk.Tags.of(this).add('Project', 'Ecommerce');
        cdk.Tags.of(this).add('Environment', 'Development');
    }
}
