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

export class EventStack extends cdk.Stack {
    public readonly eventBus: events.EventBus;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const tableName = cdk.Fn.importValue('EcommerceTableName');
        const tableArn = cdk.Fn.importValue('EcommerceTableArn');

        const orderDLQ = new sqs.Queue(this, 'OrderDLQ', {
            queueName: 'EcommerceOrderDLQ',
            retentionPeriod: cdk.Duration.days(14),
            encryption: sqs.QueueEncryption.SQS_MANAGED,
        });

        // visibilityTimeout = 6x timeout của Lambda (30s) theo khuyến nghị AWS
        const orderQueue = new sqs.Queue(this, 'OrderQueue', {
            queueName: 'EcommerceOrderQueue',
            visibilityTimeout: cdk.Duration.seconds(180),
            retentionPeriod: cdk.Duration.days(4),
            encryption: sqs.QueueEncryption.SQS_MANAGED,
            deadLetterQueue: {
                queue: orderDLQ,
                maxReceiveCount: 3,
            },
        });

        this.eventBus = new events.EventBus(this, 'EcommerceEventBus', {
            eventBusName: 'EcommerceEventBus',
        });

        // Rule chuyển event OrderCreated vào hàng đợi SQS
        // Dùng orderDLQ làm delivery DLQ để tránh mất event nếu SQS không nhận được
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
                    deadLetterQueue: orderDLQ,
                }),
            ],
        });

        const orderProcessorLogGroup = new logs.LogGroup(this, 'OrderProcessorLogs', {
            logGroupName: '/aws/lambda/OrderProcessorFunction',
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const orderProcessorFn = new lambdaNodejs.NodejsFunction(this, 'OrderProcessorFunction', {
            functionName: 'OrderProcessorFunction',
            description: 'Async order processing via SQS/EventBridge',
            runtime: lambda.Runtime.NODEJS_22_X,
            architecture: lambda.Architecture.ARM_64,
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            entry: path.join(__dirname, '../src/lambda/order-processor/index.ts'),
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
                forceDockerBundling: false,
            },
            tracing: lambda.Tracing.ACTIVE,
            logGroup: orderProcessorLogGroup,
        });

        // Chỉ cấp quyền GetItem và UpdateItem — không cần Query
        orderProcessorFn.addToRolePolicy(
            new iam.PolicyStatement({
                sid: 'OrderProcessorDynamo',
                effect: iam.Effect.ALLOW,
                actions: ['dynamodb:GetItem', 'dynamodb:UpdateItem'],
                resources: [tableArn],
            }),
        );

        orderProcessorFn.addToRolePolicy(
            new iam.PolicyStatement({
                sid: 'OrderProcessorEventBridge',
                effect: iam.Effect.ALLOW,
                actions: ['events:PutEvents'],
                resources: [this.eventBus.eventBusArn],
            }),
        );

        // batchSize=1 để mỗi Lambda chỉ xử lý 1 đơn hàng
        // reportBatchItemFailures để không re-queue những record đã thành công
        orderProcessorFn.addEventSource(
            new lambdaEventSources.SqsEventSource(orderQueue, {
                batchSize: 1,
                reportBatchItemFailures: true,
            }),
        );

        new cdk.CfnOutput(this, 'EventBusName', {
            value: this.eventBus.eventBusName,
            exportName: 'EcommerceEventBusName',
        });

        new cdk.CfnOutput(this, 'EventBusArn', {
            value: this.eventBus.eventBusArn,
            exportName: 'EcommerceEventBusArn',
        });

        new cdk.CfnOutput(this, 'OrderQueueUrl', {
            value: orderQueue.queueUrl,
            exportName: 'EcommerceOrderQueueUrl',
        });

        new cdk.CfnOutput(this, 'OrderDLQUrl', {
            value: orderDLQ.queueUrl,
            exportName: 'EcommerceOrderDLQUrl',
        });

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
