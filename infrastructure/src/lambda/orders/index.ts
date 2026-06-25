/**
 * OrderServiceFunction  —  Phase 6 update
 *
 * Protected routes (Cognito JWT required):
 *   POST /orders          → persist PENDING order, publish OrderCreated, return 202
 *   GET  /orders          → list current user's orders (newest first)
 *   GET  /orders/{id}     → get a single order by ID
 *
 * Phase 6 change:
 *   POST /orders no longer processes the order synchronously.
 *   It persists the order with STATUS=PENDING, publishes an
 *   OrderCreated event to EcommerceEventBus, and returns HTTP 202.
 *   The OrderProcessorFunction handles the async processing.
 *
 * IAM:
 *   DynamoDB:    GetItem + PutItem + Query (EcommerceTable)
 *   EventBridge: events:PutEvents (EcommerceEventBus)
 */

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

// ─── Clients ──────────────────────────────────────────────────────────────────

const eb = new EventBridgeClient({});
const eventBusName = process.env['EVENT_BUS_NAME'] ?? EVENT_BUS_NAME;

// ─── HTTP 202 Accepted helper ─────────────────────────────────────────────────

const accepted = (data: unknown): APIGatewayProxyResult => ({
    statusCode: 202,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env['ALLOWED_ORIGIN'] ?? 'http://localhost:5173',
        'Access-Control-Allow-Credentials': 'true',
    },
    body: JSON.stringify(data),
});

// ─── Handler ──────────────────────────────────────────────────────────────────

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
            return await getOrder(orderId);
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

// ─── createOrder — Phase 6 async path ────────────────────────────────────────

async function createOrder(
    userId: string,
    rawBody: string | null,
): Promise<APIGatewayProxyResult> {
    if (!rawBody) return badRequest('Request body is required');

    let body: {
        items: Array<{ productId: string; quantity: number; price: number }>;
        shippingAddress: string;
    };

    try {
        body = JSON.parse(rawBody);
    } catch {
        return badRequest('Invalid JSON body');
    }

    const { items, shippingAddress } = body;

    if (!items?.length) return badRequest('items array is required and must not be empty');
    if (!shippingAddress) return badRequest('shippingAddress is required');

    // ── 1. Persist initial order with STATUS = PENDING ────────────────────────
    const orderId = randomUUID();
    const now = new Date().toISOString();
    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = {
        PK: `ORDER#${orderId}`,
        SK: 'METADATA',
        GSI2PK: `USER#${userId}`,
        GSI2SK: `ORDER#${now}`,
        orderId,
        userId,
        items,
        shippingAddress,
        totalAmount,
        status: 'PENDING',
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

    // ── 2. Publish OrderCreated event to EcommerceEventBus ────────────────────
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

    // ── 3. Return 202 Accepted — processing happens asynchronously ────────────
    return accepted({
        message: 'Order accepted for processing',
        orderId,
        status: 'PENDING',
    });
}

// ─── Read helpers (unchanged from Phase 5) ────────────────────────────────────

async function getOrder(orderId: string): Promise<APIGatewayProxyResult> {
    const { Item } = await db.send(
        new GetItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ PK: `ORDER#${orderId}`, SK: 'METADATA' }),
        }),
    );

    if (!Item) {
        return notFound('Order');
    }

    return ok(unmarshall(Item));
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
            ScanIndexForward: false, // newest first
        }),
    );

    const items = Items.map((item) => unmarshall(item));
    return ok({ items, count: items.length });
}
