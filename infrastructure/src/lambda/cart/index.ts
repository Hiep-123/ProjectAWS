/**
 * CartServiceFunction
 *
 * Protected routes (Cognito JWT required):
 *   GET    /cart                 → list current user's cart items
 *   POST   /cart                 → add a product to the cart
 *   PUT    /cart                 → update quantity of an existing cart item
 *   DELETE /cart/{productId}     → remove an item from the cart
 *
 * IAM: GetItem + PutItem + UpdateItem + DeleteItem on EcommerceTable.
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    db,
    TABLE_NAME,
    GetItemCommand,
    PutItemCommand,
    UpdateItemCommand,
    DeleteItemCommand,
    QueryCommand,
    marshall,
    unmarshall,
} from '../shared/dynamo';
import {
    ok,
    created,
    badRequest,
    notFound,
    internalError,
    unauthorized,
} from '../shared/response';
import { extractUserId, UnauthorizedError } from '../shared/auth';

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    console.log('[CartService]', event.httpMethod, event.path);

    try {
        const userId = extractUserId(event);
        const method = event.httpMethod;
        const productId = event.pathParameters?.['productId'];

        switch (method) {
            case 'GET': return await getCart(userId);
            case 'POST': return await addToCart(userId, event.body);
            case 'PUT': return await updateCart(userId, event.body);
            case 'DELETE':
                if (!productId) return badRequest('productId path parameter is required');
                return await removeFromCart(userId, productId);
            default:
                return badRequest('Method not supported');
        }
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            return unauthorized();
        }
        return internalError(err);
    }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCart(userId: string): Promise<APIGatewayProxyResult> {
    const { Items = [] } = await db.send(
        new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression:
                'PK = :pk AND begins_with(SK, :prefix)',
            ExpressionAttributeValues: marshall({
                ':pk': `USER#${userId}`,
                ':prefix': 'CART#',
            }),
        }),
    );

    const items = Items.map((item) => unmarshall(item));
    return ok({ items, count: items.length });
}

async function addToCart(
    userId: string,
    rawBody: string | null,
): Promise<APIGatewayProxyResult> {
    if (!rawBody) return badRequest('Request body is required');

    let body: { productId: string; quantity: number; price: number };

    try {
        body = JSON.parse(rawBody);
    } catch {
        return badRequest('Invalid JSON body');
    }

    const { productId, quantity, price } = body;

    if (!productId) return badRequest('productId is required');
    if (!quantity || quantity < 1) return badRequest('quantity must be a positive number');
    if (price == null || price < 0) return badRequest('price must be a non-negative number');

    const now = new Date().toISOString();
    const item = {
        PK: `USER#${userId}`,
        SK: `CART#${productId}`,
        userId,
        productId,
        quantity,
        price,
        createdAt: now,
        updatedAt: now,
    };

    await db.send(
        new PutItemCommand({
            TableName: TABLE_NAME,
            Item: marshall(item),
        }),
    );

    return created(item);
}

async function updateCart(
    userId: string,
    rawBody: string | null,
): Promise<APIGatewayProxyResult> {
    if (!rawBody) return badRequest('Request body is required');

    let body: { productId: string; quantity: number };

    try {
        body = JSON.parse(rawBody);
    } catch {
        return badRequest('Invalid JSON body');
    }

    const { productId, quantity } = body;

    if (!productId) return badRequest('productId is required');
    if (!quantity || quantity < 1) return badRequest('quantity must be a positive number');

    const { Attributes } = await db.send(
        new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ PK: `USER#${userId}`, SK: `CART#${productId}` }),
            UpdateExpression: 'SET quantity = :qty, updatedAt = :now',
            ConditionExpression: 'attribute_exists(PK)',
            ExpressionAttributeValues: marshall({
                ':qty': quantity,
                ':now': new Date().toISOString(),
            }),
            ReturnValues: 'ALL_NEW',
        }),
    );

    if (!Attributes) {
        return notFound('Cart item');
    }

    return ok(unmarshall(Attributes));
}

async function removeFromCart(
    userId: string,
    productId: string,
): Promise<APIGatewayProxyResult> {
    // Check existence first so we can return 404 instead of silently no-oping.
    const { Item } = await db.send(
        new GetItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ PK: `USER#${userId}`, SK: `CART#${productId}` }),
        }),
    );

    if (!Item) {
        return notFound('Cart item');
    }

    await db.send(
        new DeleteItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ PK: `USER#${userId}`, SK: `CART#${productId}` }),
        }),
    );

    return ok({ message: 'Item removed from cart' });
}
