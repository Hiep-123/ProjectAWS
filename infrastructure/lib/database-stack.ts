import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class DatabaseStack extends cdk.Stack {
    public readonly table: dynamodb.TableV2;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.table = new dynamodb.TableV2(this, 'EcommerceTable', {
            tableName: 'EcommerceTable',
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
            billing: dynamodb.Billing.onDemand(),
            encryption: dynamodb.TableEncryptionV2.awsManagedKey(),
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            timeToLiveAttribute: 'TTL',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            globalSecondaryIndexes: [
                {
                    indexName: 'GSI1',
                    partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
                    sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
                    projectionType: dynamodb.ProjectionType.ALL,
                },
                {
                    indexName: 'GSI2',
                    partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
                    sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
                    projectionType: dynamodb.ProjectionType.ALL,
                },
                {
                    indexName: 'GSI3',
                    partitionKey: { name: 'GSI3PK', type: dynamodb.AttributeType.STRING },
                    sortKey: { name: 'GSI3SK', type: dynamodb.AttributeType.STRING },
                    projectionType: dynamodb.ProjectionType.ALL,
                },
            ],
        });

        cdk.Tags.of(this.table).add('Project', 'Ecommerce');
        cdk.Tags.of(this.table).add('Environment', 'Development');

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
