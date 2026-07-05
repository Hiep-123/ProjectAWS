import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    db,
    TABLE_NAME,
    GetItemCommand,
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

async function getCart(userId: string): Promise<APIGatewayProxyResult> {
    const { Items = [] } = await db.send(
        new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
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

    // Dùng ADD để cộng dồn số lượng nếu item đã có trong giỏ
    const { Attributes } = await db.send(
        new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ PK: `USER#${userId}`, SK: `CART#${productId}` }),
            UpdateExpression:
                'SET userId = if_not_exists(userId, :uid), ' +
                'productId = if_not_exists(productId, :pid), ' +
                'price = :price, ' +
                'createdAt = if_not_exists(createdAt, :now), ' +
                'updatedAt = :now ' +
                'ADD quantity :qty',
            ExpressionAttributeValues: marshall({
                ':uid': userId,
                ':pid': productId,
                ':price': price,
                ':qty': quantity,
                ':now': now,
            }),
            ReturnValues: 'ALL_NEW',
        }),
    );

    const updatedItem = Attributes ? unmarshall(Attributes) : {
        PK: `USER#${userId}`,
        SK: `CART#${productId}`,
        userId,
        productId,
        quantity,
        price,
        createdAt: now,
        updatedAt: now,
    };

    return created(updatedItem);
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
