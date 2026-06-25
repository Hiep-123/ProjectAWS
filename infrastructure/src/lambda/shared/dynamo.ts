/**
 * shared/dynamo.ts
 *
 * DynamoDB client singleton and low-level helpers.
 *
 * The client is instantiated once at module scope so it is reused
 * across Lambda invocations in the same execution environment,
 * preserving HTTP keep-alive connections and reducing cold-start
 * overhead.
 *
 * All handlers import { db, TABLE_NAME } from this module instead of
 * constructing their own clients.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

export type { AttributeValue } from '@aws-sdk/client-dynamodb';
export {
    GetItemCommand,
    PutItemCommand,
    UpdateItemCommand,
    DeleteItemCommand,
    QueryCommand,
} from '@aws-sdk/client-dynamodb';
export { marshall, unmarshall };

/**
 * Single DynamoDB client instance shared across all calls.
 * No explicit region needed — Lambda injects AWS_REGION automatically.
 */
export const db = new DynamoDBClient({});

/**
 * The EcommerceTable name, injected at deploy time via the CDK
 * environment variable TABLE_NAME.
 */
export const TABLE_NAME = process.env['TABLE_NAME']!;
