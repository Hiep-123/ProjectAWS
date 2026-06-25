/**
 * ProductServiceFunction
 *
 * Public routes (no auth required):
 *   GET /products             → list products; optional ?category= filter
 *   GET /products/{id}        → get single product by ID
 *
 * IAM: GetItem + Query on EcommerceTable and its indexes (read-only).
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    db,
    TABLE_NAME,
    GetItemCommand,
    QueryCommand,
    marshall,
    unmarshall,
} from '../shared/dynamo';
import { ok, notFound, internalError } from '../shared/response';

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    console.log('[ProductService]', event.httpMethod, event.path);

    try {
        const productId = event.pathParameters?.['id'];

        if (productId) {
            return await getProduct(productId);
        }

        const category = event.queryStringParameters?.['category'];
        return await listProducts(category);
    } catch (err) {
        return internalError(err);
    }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getProduct(productId: string): Promise<APIGatewayProxyResult> {
    const { Item } = await db.send(
        new GetItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ PK: `PRODUCT#${productId}`, SK: 'METADATA' }),
        }),
    );

    if (!Item) {
        return notFound('Product');
    }

    return ok(unmarshall(Item));
}

async function listProducts(
    category?: string,
): Promise<APIGatewayProxyResult> {
    if (category) {
        const { Items = [] } = await db.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: 'GSI1',
                KeyConditionExpression:
                    'GSI1PK = :pk AND begins_with(GSI1SK, :prefix)',
                ExpressionAttributeValues: marshall({
                    ':pk': `CATEGORY#${category}`,
                    ':prefix': 'PRODUCT#',
                }),
            }),
        );

        const items = Items.map((item) => unmarshall(item));
        return ok({ items, count: items.length });
    }

    // No category supplied — return all products indexed under CATEGORY#all.
    // Callers that seed the table should write GSI1PK='CATEGORY#all' on every
    // product item so this catch-all query works.
    const { Items = [] } = await db.send(
        new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk',
            ExpressionAttributeValues: marshall({ ':pk': 'CATEGORY#all' }),
        }),
    );

    const items = Items.map((item) => unmarshall(item));
    return ok({ items, count: items.length });
}
