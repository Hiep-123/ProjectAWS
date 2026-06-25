import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

/**
 * DatabaseStack
 *
 * Implements a DynamoDB Single-Table Design for the ecommerce platform.
 *
 * Single Table: EcommerceTable
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Entity         │  PK                   │  SK                       │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  Product        │  PRODUCT#{productId}  │  METADATA                 │
 * │  User           │  USER#{userId}        │  PROFILE                  │
 * │  Cart Item      │  USER#{userId}        │  CART#{productId}         │
 * │  Order          │  ORDER#{orderId}      │  METADATA                 │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * GSI1 — Product Search by category
 *   GSI1PK: CATEGORY#{category}  |  GSI1SK: PRODUCT#{productId}
 *
 * GSI2 — User Orders by date
 *   GSI2PK: USER#{userId}  |  GSI2SK: ORDER#{createdAt}
 */
export class DatabaseStack extends cdk.Stack {
    /**
     * The single DynamoDB table shared by all services.
     * Exposed as a public readonly so future stacks (ApiStack) can
     * reference it via cross-stack grants without string lookups.
     */
    public readonly table: dynamodb.TableV2;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // ─────────────────────────────────────────────────────────────────
        // EcommerceTable — Single-table design
        // ─────────────────────────────────────────────────────────────────
        this.table = new dynamodb.TableV2(this, 'EcommerceTable', {
            tableName: 'EcommerceTable',

            // ── Primary key ──────────────────────────────────────────────
            partitionKey: {
                name: 'PK',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'SK',
                type: dynamodb.AttributeType.STRING,
            },

            // ── Billing ──────────────────────────────────────────────────
            // PAY_PER_REQUEST scales automatically with traffic and
            // requires no capacity planning — ideal for all phases.
            billing: dynamodb.Billing.onDemand(),

            // ── Encryption ───────────────────────────────────────────────
            // AWS managed key (SSE enabled, no additional KMS cost).
            encryption: dynamodb.TableEncryptionV2.awsManagedKey(),

            // ── Continuous backups ────────────────────────────────────────
            // Point-in-time recovery allows restore to any second within
            // the last 35 days (default retention period).
            pointInTimeRecoverySpecification: {
                pointInTimeRecoveryEnabled: true,
            },

            // ── TTL ───────────────────────────────────────────────────────
            // Cart items and sessions can self-expire via this attribute.
            timeToLiveAttribute: 'TTL',

            // ── Removal policy ────────────────────────────────────────────
            // DESTROY for development; change to RETAIN before production.
            removalPolicy: cdk.RemovalPolicy.DESTROY,

            // ── GSI1: Product Search by category ─────────────────────────
            // Access pattern: "give me all products in category X"
            // GSI1PK = CATEGORY#{category}
            // GSI1SK = PRODUCT#{productId}
            globalSecondaryIndexes: [
                {
                    indexName: 'GSI1',
                    partitionKey: {
                        name: 'GSI1PK',
                        type: dynamodb.AttributeType.STRING,
                    },
                    sortKey: {
                        name: 'GSI1SK',
                        type: dynamodb.AttributeType.STRING,
                    },
                    projectionType: dynamodb.ProjectionType.ALL,
                },

                // ── GSI2: User Orders by date ───────────────────────────────
                // Access pattern: "give me all orders for user X sorted by date"
                // GSI2PK = USER#{userId}
                // GSI2SK = ORDER#{createdAt}   (ISO-8601 sorts lexicographically)
                {
                    indexName: 'GSI2',
                    partitionKey: {
                        name: 'GSI2PK',
                        type: dynamodb.AttributeType.STRING,
                    },
                    sortKey: {
                        name: 'GSI2SK',
                        type: dynamodb.AttributeType.STRING,
                    },
                    projectionType: dynamodb.ProjectionType.ALL,
                },
                {
                    indexName: 'GSI3',
                    partitionKey: {
                        name: 'GSI3PK',
                        type: dynamodb.AttributeType.STRING,
                    },
                    sortKey: {
                        name: 'GSI3SK',
                        type: dynamodb.AttributeType.STRING,
                    },
                    projectionType: dynamodb.ProjectionType.ALL,
                },
            ],
        });

        // ── Tags ────────────────────────────────────────────────────────
        cdk.Tags.of(this.table).add('Project', 'Ecommerce');
        cdk.Tags.of(this.table).add('Environment', 'Development');

        // ─────────────────────────────────────────────────────────────────
        // Outputs
        // ─────────────────────────────────────────────────────────────────
        new cdk.CfnOutput(this, 'TableName', {
            value: this.table.tableName,
            description: 'DynamoDB single table name',
            exportName: 'EcommerceTableName',
        });

        new cdk.CfnOutput(this, 'TableArn', {
            value: this.table.tableArn,
            description: 'DynamoDB single table ARN',
            exportName: 'EcommerceTableArn',
        });
    }
}
