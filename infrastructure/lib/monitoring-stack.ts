import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

/**
 * MonitoringStack — CloudWatch observability
 *
 * Dashboard: EcommerceDashboard (5 rows — API Gateway, EventBridge, OrderService, OrderProcessor, SQS)
 * Alarms (6): Lambda errors, Lambda throttles, DLQ depth, API Gateway 5XX
 * All resource names imported via Fn.importValue.
 */
export class MonitoringStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // ─────────────────────────────────────────────────────────────────
        // Cross-stack imports
        // ─────────────────────────────────────────────────────────────────
        const orderProcessorFnName = cdk.Fn.importValue('EcommerceOrderProcessorFunctionName');
        const orderQueueName = cdk.Fn.importValue('EcommerceOrderQueueName');
        const orderDLQName = cdk.Fn.importValue('EcommerceOrderDLQName');
        const eventBusName = cdk.Fn.importValue('EcommerceEventBusName');

        // ─────────────────────────────────────────────────────────────────
        // SNS Topic — alarm notifications
        // ─────────────────────────────────────────────────────────────────
        const alarmTopic = new sns.Topic(this, 'AlarmsTopic', {
            topicName: 'EcommerceAlarmsTopic',
            displayName: 'Ecommerce Platform Alarms',
        });

        // ── Email subscription ────────────────────────────────────────────
        // ALERT_EMAIL is read from the environment at CDK synth/deploy time.
        // After deployment, AWS SNS will send a confirmation email to this
        // address. The subscriber MUST click the confirmation link — until
        // then, SNS accepts alarm messages but does not forward them.
        //
        // If ALERT_EMAIL is not set, the subscription is skipped and a
        // CDK warning is printed. Alarms still fire and the SNS topic
        // still receives messages; they are just not delivered to email.
        const alertEmail = process.env['ALERT_EMAIL'];
        if (alertEmail) {
            alarmTopic.addSubscription(
                new snsSubscriptions.EmailSubscription(alertEmail),
            );
        } else {
            cdk.Annotations.of(this).addWarning(
                'ALERT_EMAIL environment variable is not set. ' +
                'CloudWatch alarm notifications will NOT be delivered by email. ' +
                'Set ALERT_EMAIL in infrastructure/.env and redeploy MonitoringStack.',
            );
        }

        const alarmAction = new cloudwatchActions.SnsAction(alarmTopic);

        // ─────────────────────────────────────────────────────────────────
        // Helper — typed metric factory
        // ─────────────────────────────────────────────────────────────────
        const lambdaMetric = (
            metricName: string,
            functionName: string | cdk.Reference,
            statistic: string,
            period = cdk.Duration.minutes(1),
        ) =>
            new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName,
                dimensionsMap: { FunctionName: functionName as string },
                statistic,
                period,
            });

        // ─────────────────────────────────────────────────────────────────
        // Metric definitions
        // ─────────────────────────────────────────────────────────────────

        // ── API Gateway ───────────────────────────────────────────────────
        const apiRequestsMetric = new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: { ApiName: 'EcommerceApi', Stage: 'prod' },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
        });
        const api5xxMetric = new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: { ApiName: 'EcommerceApi', Stage: 'prod' },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
        });

        // ── EventBridge ───────────────────────────────────────────────────
        // MatchedEvents counts how many events matched the OrderCreated rule
        const eventBridgeMatchedMetric = new cloudwatch.Metric({
            namespace: 'AWS/Events',
            metricName: 'MatchedEvents',
            dimensionsMap: {
                EventBusName: eventBusName as string,
                RuleName: 'EcommerceOrderCreatedRule',
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
        });
        // FailedInvocations on the rule = EventBridge failed to deliver to SQS
        const eventBridgeFailedMetric = new cloudwatch.Metric({
            namespace: 'AWS/Events',
            metricName: 'FailedInvocations',
            dimensionsMap: {
                EventBusName: eventBusName as string,
                RuleName: 'EcommerceOrderCreatedRule',
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
        });

        // ── OrderServiceFunction ──────────────────────────────────────────
        const orderSvcInvocations = lambdaMetric('Invocations', 'OrderServiceFunction', 'Sum');
        const orderSvcErrors = lambdaMetric('Errors', 'OrderServiceFunction', 'Sum');
        const orderSvcThrottles = lambdaMetric('Throttles', 'OrderServiceFunction', 'Sum');
        const orderSvcDuration = lambdaMetric('Duration', 'OrderServiceFunction', 'p99', cdk.Duration.minutes(5));

        // ── OrderProcessorFunction ────────────────────────────────────────
        const processorInvocations = lambdaMetric('Invocations', orderProcessorFnName, 'Sum');
        const processorErrors = lambdaMetric('Errors', orderProcessorFnName, 'Sum');
        const processorThrottles = lambdaMetric('Throttles', orderProcessorFnName, 'Sum');
        const processorDuration = lambdaMetric('Duration', orderProcessorFnName, 'p99', cdk.Duration.minutes(5));

        // ── SQS ───────────────────────────────────────────────────────────
        const orderQueueDepth = new cloudwatch.Metric({
            namespace: 'AWS/SQS',
            metricName: 'ApproximateNumberOfMessagesVisible',
            dimensionsMap: { QueueName: orderQueueName as string },
            statistic: 'Maximum',
            period: cdk.Duration.minutes(1),
        });
        const dlqDepth = new cloudwatch.Metric({
            namespace: 'AWS/SQS',
            metricName: 'ApproximateNumberOfMessagesVisible',
            dimensionsMap: { QueueName: orderDLQName as string },
            statistic: 'Maximum',
            period: cdk.Duration.minutes(1),
        });

        // ─────────────────────────────────────────────────────────────────
        // CloudWatch Dashboard
        // ─────────────────────────────────────────────────────────────────
        const dashboard = new cloudwatch.Dashboard(this, 'EcommerceDashboard', {
            dashboardName: 'EcommerceDashboard',
            periodOverride: cloudwatch.PeriodOverride.AUTO,
        });

        // ── Row 1: API Gateway ────────────────────────────────────────────
        dashboard.addWidgets(
            new cloudwatch.TextWidget({
                markdown: '## API Gateway — EcommerceApi (prod)',
                width: 24, height: 1,
            }),
        );
        dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'API Requests / min',
                left: [apiRequestsMetric],
                width: 12, height: 6,
            }),
            new cloudwatch.GraphWidget({
                title: 'API 5XX Errors / min',
                left: [api5xxMetric],
                width: 12, height: 6,
            }),
        );

        // ── Row 2: EventBridge ────────────────────────────────────────────
        dashboard.addWidgets(
            new cloudwatch.TextWidget({
                markdown: '## EventBridge — EcommerceEventBus / OrderCreated rule',
                width: 24, height: 1,
            }),
        );
        dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'EventBridge Matched (Orders Processed)',
                left: [eventBridgeMatchedMetric],
                width: 12, height: 6,
            }),
            new cloudwatch.GraphWidget({
                title: 'EventBridge Failed Invocations',
                left: [eventBridgeFailedMetric],
                width: 12, height: 6,
            }),
        );

        // ── Row 3: Lambda — OrderServiceFunction ──────────────────────────
        dashboard.addWidgets(
            new cloudwatch.TextWidget({
                markdown: '## Lambda — OrderServiceFunction',
                width: 24, height: 1,
            }),
        );
        dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'OrderService Invocations',
                left: [orderSvcInvocations],
                width: 6, height: 6,
            }),
            new cloudwatch.GraphWidget({
                title: 'OrderService Errors',
                left: [orderSvcErrors],
                width: 6, height: 6,
            }),
            new cloudwatch.GraphWidget({
                title: 'OrderService Throttles',
                left: [orderSvcThrottles],
                width: 6, height: 6,
            }),
            new cloudwatch.GraphWidget({
                title: 'OrderService Duration p99 (ms)',
                left: [orderSvcDuration],
                width: 6, height: 6,
            }),
        );

        // ── Row 4: Lambda — OrderProcessorFunction ────────────────────────
        dashboard.addWidgets(
            new cloudwatch.TextWidget({
                markdown: '## Lambda — OrderProcessorFunction',
                width: 24, height: 1,
            }),
        );
        dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'OrderProcessor Invocations',
                left: [processorInvocations],
                width: 6, height: 6,
            }),
            new cloudwatch.GraphWidget({
                title: 'OrderProcessor Errors',
                left: [processorErrors],
                width: 6, height: 6,
            }),
            new cloudwatch.GraphWidget({
                title: 'OrderProcessor Throttles',
                left: [processorThrottles],
                width: 6, height: 6,
            }),
            new cloudwatch.GraphWidget({
                title: 'OrderProcessor Duration p99 (ms)',
                left: [processorDuration],
                width: 6, height: 6,
            }),
        );

        // ── Row 5: SQS ────────────────────────────────────────────────────
        dashboard.addWidgets(
            new cloudwatch.TextWidget({
                markdown: '## SQS — OrderQueue & DLQ',
                width: 24, height: 1,
            }),
        );
        dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'OrderQueue Depth',
                left: [orderQueueDepth],
                width: 12, height: 6,
            }),
            new cloudwatch.GraphWidget({
                title: 'DLQ Messages (failures)',
                left: [dlqDepth],
                width: 12, height: 6,
            }),
        );

        // ─────────────────────────────────────────────────────────────────
        // Alarms — all thresholds at > 0 for Errors/Throttles/DLQ,
        //          > 5 for API 5XX (transient spikes are acceptable).
        //          TreatMissingData=NOT_BREACHING prevents false positives
        //          during quiet periods.
        // ─────────────────────────────────────────────────────────────────
        const makeAlarm = (
            id: string,
            name: string,
            description: string,
            metric: cloudwatch.Metric,
            threshold: number,
        ) => {
            const alarm = new cloudwatch.Alarm(this, id, {
                alarmName: name,
                alarmDescription: description,
                metric,
                threshold,
                evaluationPeriods: 1,
                comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            });
            alarm.addAlarmAction(alarmAction);
            return alarm;
        };

        // 1. OrderProcessor Errors > 0
        makeAlarm(
            'OrderProcessorErrorsAlarm',
            'EcommerceOrderProcessorErrors',
            'OrderProcessorFunction recorded errors — investigate immediately',
            processorErrors,
            0,
        );

        // 2. OrderService Errors > 0
        makeAlarm(
            'OrderServiceErrorsAlarm',
            'EcommerceOrderServiceErrors',
            'OrderServiceFunction recorded errors — check API Gateway logs',
            orderSvcErrors,
            0,
        );

        // 3. DLQ Messages > 0
        makeAlarm(
            'DLQMessagesAlarm',
            'EcommerceOrderDLQMessages',
            'Messages in Order DLQ — order processing failures require investigation',
            dlqDepth,
            0,
        );

        // 4. API Gateway 5XX > 5
        makeAlarm(
            'ApiGateway5XXAlarm',
            'EcommerceApiGateway5XX',
            'API Gateway 5XX errors above threshold',
            api5xxMetric,
            5,
        );

        // 5. OrderProcessor Throttles > 0
        makeAlarm(
            'OrderProcessorThrottlesAlarm',
            'EcommerceOrderProcessorThrottles',
            'OrderProcessorFunction is being throttled — consider reserved concurrency',
            processorThrottles,
            0,
        );

        // 6. OrderService Throttles > 0
        makeAlarm(
            'OrderServiceThrottlesAlarm',
            'EcommerceOrderServiceThrottles',
            'OrderServiceFunction is being throttled — check concurrency limits',
            orderSvcThrottles,
            0,
        );

        // ─────────────────────────────────────────────────────────────────
        // Outputs
        // ─────────────────────────────────────────────────────────────────
        new cdk.CfnOutput(this, 'DashboardName', {
            value: dashboard.dashboardName,
            description: 'CloudWatch dashboard name',
            exportName: 'EcommerceDashboardName',
        });

        new cdk.CfnOutput(this, 'AlarmsTopicArn', {
            value: alarmTopic.topicArn,
            description: 'SNS topic ARN for alarm notifications',
            exportName: 'EcommerceAlarmsTopicArn',
        });

        cdk.Tags.of(this).add('Project', 'Ecommerce');
        cdk.Tags.of(this).add('Environment', 'Development');
    }
}
