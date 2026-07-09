import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import {
    EventBridgeClient,
    PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import {
    db,
    TABLE_NAME,
    GetItemCommand,
    PutItemCommand,
    QueryCommand,
    marshall,
    unmarshall,
} from '../shared/dynamo';
import {
    ok,
    badRequest,
    notFound,
    internalError,
    unauthorized,
} from '../shared/response';
import { extractUserId, UnauthorizedError } from '../shared/auth';
import { buildOrderCreatedEvent } from '../../events/order-created';
import { EVENT_BUS_NAME } from '../../events/types';

const eb = new EventBridgeClient({});
const eventBusName = process.env['EVENT_BUS_NAME'] ?? EVENT_BUS_NAME;

const accepted = (data: unknown): APIGatewayProxyResult => ({
    statusCode: 202,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env['ALLOWED_ORIGIN'] ?? 'http://localhost:5173',
        'Access-Control-Allow-Credentials': 'true',
    },
    body: JSON.stringify(data),
});

export const handler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    console.log('[OrderService]', event.httpMethod, event.path);

    try {
        const userId = extractUserId(event);
        const method = event.httpMethod;
        const orderId = event.pathParameters?.['id'];

        if (method === 'POST') {
            return await createOrder(userId, event.body);
        }

        if (method === 'GET' && orderId) {
            return await getOrder(userId, orderId);
        }

        if (method === 'GET') {
            return await listOrders(userId);
        }

        return badRequest('Method not supported');
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            return unauthorized();
        }
        return internalError(err);
    }
};

async function createOrder(
    userId: string,
    rawBody: string | null,
): Promise<APIGatewayProxyResult> {
    if (!rawBody) return badRequest('Request body is required');

    let body: {
        items: Array<{ productId: string; quantity: number; price: number }>;
        shippingAddress: string;
        paymentMethod?: string;
        deliveryMethod?: 'standard' | 'express' | 'overnight';
        couponCode?: string;
    };

    try {
        body = JSON.parse(rawBody);
    } catch {
        return badRequest('Invalid JSON body');
    }

    const { items, shippingAddress, paymentMethod, deliveryMethod, couponCode } = body;

    if (!Array.isArray(items) || items.length === 0) {
        return badRequest('items array is required and must not be empty');
    }
    if (typeof shippingAddress !== 'string' || shippingAddress.trim() === '') {
        return badRequest('shippingAddress is required');
    }
    for (let i = 0; i < items.length; i++) {
        const item = items[i]!;
        if (typeof item.productId !== 'string' || item.productId.trim() === '') {
            return badRequest(`items[${i}].productId must be a non-empty string`);
        }
        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
            return badRequest(`items[${i}].quantity must be a positive integer`);
        }
        if (typeof item.price !== 'number' || item.price < 0) {
            return badRequest(`items[${i}].price must be a non-negative number`);
        }
    }

    const orderId = randomUUID();
    const now = new Date().toISOString();
    
    // Unify pricing calculation with frontend: total = subtotal + tax + shipping - discount
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% TAX_RATE
    
    let shippingCost = 0;
    if (deliveryMethod === 'express') {
        shippingCost = 24.99;
    } else if (deliveryMethod === 'overnight') {
        shippingCost = 49.99;
    }
    
    const discount = couponCode ? 10 : 0; // Mock discount matches frontend CartContext
    const totalAmount = Math.max(0, Math.round((subtotal + tax + shippingCost - discount) * 100) / 100);

    const order = {
        PK: `ORDER#${orderId}`,
        SK: 'METADATA',
        GSI2PK: `USER#${userId}`, // GSI2 keys prefix
        GSI2SK: `ORDER#${now}`,
        orderId,
        userId,
        items,
        shippingAddress,
        totalAmount,
        status: 'PENDING',
        paymentMethod: paymentMethod || 'credit_card',
        paymentStatus: paymentMethod === 'vnpay' ? 'UNPAID' : 'PAID',
        createdAt: now,
        updatedAt: now,
    };

    await db.send(
        new PutItemCommand({
            TableName: TABLE_NAME,
            Item: marshall(order),
            ConditionExpression: 'attribute_not_exists(PK)',
        }),
    );

    if (paymentMethod !== 'vnpay') {
        const domainEvent = buildOrderCreatedEvent({
            orderId,
            userId,
            items,
            shippingAddress,
            totalAmount,
            createdAt: now,
        });

        await eb.send(
            new PutEventsCommand({
                Entries: [
                    {
                        EventBusName: eventBusName,
                        Source: 'ecommerce.orders',
                        DetailType: 'OrderCreated',
                        Detail: JSON.stringify(domainEvent),
                    },
                ],
            }),
        );

        console.log('[OrderService] OrderCreated event published', JSON.stringify({ orderId }));
    } else {
        console.log('[OrderService] OrderCreated event deferred for VNPay payment', JSON.stringify({ orderId }));
    }

    return accepted({
        message: 'Order accepted for processing',
        orderId,
        status: 'PENDING',
    });
}

async function getOrder(userId: string, orderId: string): Promise<APIGatewayProxyResult> {
    const { Item } = await db.send(
        new GetItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ PK: `ORDER#${orderId}`, SK: 'METADATA' }),
        }),
    );

    if (!Item) {
        return notFound('Order');
    }

    const order = unmarshall(Item);

    if (order['userId'] !== userId) {
        console.warn('[OrderService] Ownership mismatch', JSON.stringify({
            requestingUser: userId,
            orderId,
        }));
        return notFound('Order');
    }

    return ok(order);
}

async function listOrders(userId: string): Promise<APIGatewayProxyResult> {
    const { Items = [] } = await db.send(
        new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'GSI2',
            KeyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :prefix)',
            ExpressionAttributeValues: marshall({
                ':pk': `USER#${userId}`,
                ':prefix': 'ORDER#',
            }),
            ScanIndexForward: false,
        }),
    );

    const items = Items.map((item) => unmarshall(item));
    return ok({ items, count: items.length });
}
