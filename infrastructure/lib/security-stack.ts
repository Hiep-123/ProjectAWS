import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';

/**
 * SecurityStack — WAF v2 WebACL for CloudFront
 *
 * IMPORTANT: WAFv2 WebACLs for CloudFront must be in us-east-1.
 * This stack always deploys to us-east-1 regardless of the app region.
 *
 * Rules (priority order):
 *   0 — IP Reputation List  (known malicious IPs)
 *   1 — Common Rule Set     (OWASP Top 10)
 *   2 — Known Bad Inputs    (Log4j, Spring4Shell, SSRF)
 *  10 — Rate limit: 1000 req / 5 min per IP
 */
export class SecurityStack extends cdk.Stack {
    public readonly webAclArn: string;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        // WAF for CloudFront MUST be in us-east-1
        super(scope, id, {
            ...props,
            env: {
                account: props?.env?.account,
                region: 'us-east-1',
            },
        });

        // ─────────────────────────────────────────────────────────────────
        // WAF WebACL — CLOUDFRONT scope
        //
        // Managed rule groups are evaluated in priority order.
        // All use WCU (Web ACL Capacity Units) — managed rules listed here
        // have well-known WCU costs:
        //   AWSManagedRulesAmazonIpReputationList  25 WCU
        //   AWSManagedRulesCommonRuleSet            700 WCU
        //   AWSManagedRulesKnownBadInputsRuleSet    200 WCU
        //   RateBasedRule                           2 WCU
        //   Total: 927 WCU (limit: 5000)
        // ─────────────────────────────────────────────────────────────────
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
                // ── Priority 0: IP Reputation List ────────────────────────
                // Blocks requests from IPs on AWS threat intelligence feeds
                // (botnets, malware C2 servers, Tor exit nodes, scanners).
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

                // ── Priority 1: Common Rule Set (OWASP Top 10) ────────────
                // Blocks SQL injection, XSS, path traversal, file inclusion,
                // and other common web attack vectors.
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

                // ── Priority 2: Known Bad Inputs ──────────────────────────
                // Blocks request patterns known to be exploits: Log4JRCE,
                // Spring4Shell, SSRF attempts, JavaDeserialisation, etc.
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

                // ── Priority 10: Rate-based rule ──────────────────────────
                // Blocks any IP that sends > 1000 requests in a 5-minute
                // window. Evaluated last so legitimate high-volume IPs that
                // trip managed rules are blocked at priority 0-2 first.
                // 1000 req / 300s ≈ 3.3 rps sustained — suitable for an
                // authenticated ecommerce SPA.
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

        // ─────────────────────────────────────────────────────────────────
        // WAF Logging → CloudWatch Log Group
        //
        // AWS requires the log group name to start with "aws-waf-logs-".
        // Logs include: blocked requests, matched rules, sampled requests.
        // ─────────────────────────────────────────────────────────────────
        const wafLogGroup = new logs.LogGroup(this, 'WafLogGroup', {
            // AWS WAF logging requirement: name MUST start with aws-waf-logs-
            logGroupName: 'aws-waf-logs-ecommerce',
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const wafLogging = new wafv2.CfnLoggingConfiguration(this, 'WafLogging', {
            resourceArn: webAcl.attrArn,
            logDestinationConfigs: [wafLogGroup.logGroupArn],
        });

        // WAF logging configuration must wait for the log group to exist
        wafLogging.node.addDependency(wafLogGroup);

        // ─────────────────────────────────────────────────────────────────
        // Expose ARN for FrontendStack to attach to CloudFront
        // ─────────────────────────────────────────────────────────────────
        this.webAclArn = webAcl.attrArn;

        // ─────────────────────────────────────────────────────────────────
        // Outputs
        // ─────────────────────────────────────────────────────────────────
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
