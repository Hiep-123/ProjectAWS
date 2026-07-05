import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

export {
    GetItemCommand,
    PutItemCommand,
    UpdateItemCommand,
    DeleteItemCommand,
    QueryCommand,
} from '@aws-sdk/client-dynamodb';
export { marshall, unmarshall };

export const db = new DynamoDBClient({});

const _tableName = process.env['TABLE_NAME'];
if (!_tableName) {
    throw new Error('TABLE_NAME environment variable is required');
}
export const TABLE_NAME: string = _tableName;
