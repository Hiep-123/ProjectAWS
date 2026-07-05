import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';

export class SecurityStack extends cdk.Stack {
    public readonly webAclArn: string;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, {
            ...props,
            env: {
                account: props?.env?.account,
                region: 'us-east-1',
            },
        });

        // WAF cho CloudFront ở us-east-1.
        const webAcl = new wafv2.CfnWebACL(this, 'EcommerceWebACL', {
            name: 'EcommerceWebACL',
            description: 'WAF WebACL for the Ecommerce CloudFront distribution',
            scope: 'CLOUDFRONT',

            // Default action: allow all traffic that doesn't match a BLOCK rule
            defaultAction: { allow: {} },

            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'EcommerceWebACL',
                sampledRequestsEnabled: true,
            },

            rules: [
                // Chặn IP có dấu hiệu bất thường.
                {
                    name: 'AWSManagedRulesAmazonIpReputationList',
                    priority: 0,
                    overrideAction: { none: {} },
                    statement: {
                        managedRuleGroupStatement: {
                            vendorName: 'AWS',
                            name: 'AWSManagedRulesAmazonIpReputationList',
                        },
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'AWSManagedRulesAmazonIpReputationList',
                        sampledRequestsEnabled: true,
                    },
                },

                // Chặn các pattern web attack phổ biến.
                {
                    name: 'AWSManagedRulesCommonRuleSet',
                    priority: 1,
                    overrideAction: { none: {} },
                    statement: {
                        managedRuleGroupStatement: {
                            vendorName: 'AWS',
                            name: 'AWSManagedRulesCommonRuleSet',
                        },
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'AWSManagedRulesCommonRuleSet',
                        sampledRequestsEnabled: true,
                    },
                },

                // Chặn input đáng ngờ.
                {
                    name: 'AWSManagedRulesKnownBadInputsRuleSet',
                    priority: 2,
                    overrideAction: { none: {} },
                    statement: {
                        managedRuleGroupStatement: {
                            vendorName: 'AWS',
                            name: 'AWSManagedRulesKnownBadInputsRuleSet',
                        },
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'AWSManagedRulesKnownBadInputsRuleSet',
                        sampledRequestsEnabled: true,
                    },
                },

                // Giới hạn tần suất cho mỗi IP.
                {
                    name: 'RateLimitPerIP',
                    priority: 10,
                    action: { block: {} },
                    statement: {
                        rateBasedStatement: {
                            limit: 1000,
                            aggregateKeyType: 'IP',
                            // 5-minute evaluation window (AWS default for rate-based rules)
                            evaluationWindowSec: 300,
                        },
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'RateLimitPerIP',
                        sampledRequestsEnabled: true,
                    },
                },
            ],
        });

        // Ghi log WAF vào CloudWatch.
        const wafLogGroup = new logs.LogGroup(this, 'WafLogGroup', {
            logGroupName: 'aws-waf-logs-ecommerce',
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const wafLogging = new wafv2.CfnLoggingConfiguration(this, 'WafLogging', {
            resourceArn: webAcl.attrArn,
            logDestinationConfigs: [wafLogGroup.logGroupArn],
        });

        wafLogging.node.addDependency(wafLogGroup);
        this.webAclArn = webAcl.attrArn;

        // Output cho stack khác dùng.
        new cdk.CfnOutput(this, 'WafWebAclArn', {
            value: webAcl.attrArn,
            description: 'WAF WebACL ARN — attached to CloudFront distribution',
            exportName: 'EcommerceWafWebAclArn',
        });

        new cdk.CfnOutput(this, 'WafWebAclId', {
            value: webAcl.attrId,
            description: 'WAF WebACL ID',
            exportName: 'EcommerceWafWebAclId',
        });

        new cdk.CfnOutput(this, 'WafLogGroupName', {
            value: wafLogGroup.logGroupName,
            description: 'CloudWatch Log Group receiving WAF logs',
            exportName: 'EcommerceWafLogGroupName',
        });

        cdk.Tags.of(this).add('Project', 'Ecommerce');
        cdk.Tags.of(this).add('Environment', 'Development');
    }
}
