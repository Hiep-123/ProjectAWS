/**
 * OrderProcessorFunction
 *
 * Triggered by SQS (OrderQueue) which receives OrderCreated events
 * forwarded from EcommerceEventBus via an EventBridge rule.
 *
 * Responsibilities:
 *   1. Parse and validate the OrderCreated event from the SQS message body
 *   2. Update order status → PROCESSING in DynamoDB
 *   3. Emit OrderProcessing event to EventBridge
 *   4. Simulate order fulfilment logic (extendable)
 *   5. Update order status → COMPLETED in DynamoDB
 *   6. Emit OrderCompleted event to EventBridge
 *
 * On any unrecoverable error:
 *   - Update order status → FAILED in DynamoDB
 *   - Emit OrderFailed event to EventBridge
 *   - Re-throw so SQS can route the message to the DLQ
 *
 * IAM:
 *   DynamoDB: GetItem + UpdateItem + Query (EcommerceTable only)
 *   EventBridge: events:PutEvents (EcommerceEventBus only)
 */

import type { SQSEvent, SQSRecord } from 'aws-lambda';
import {
    EventBridgeClient,
    PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import {
    db,
    TABLE_NAME,
    GetItemCommand,
    UpdateItemCommand,
    marshall,
    unmarshall,
} from '../shared/dynamo';
import type { OrderCreatedEvent } from '../../events/order-created';
import {
    buildOrderProcessingEvent,
} from '../../events/order-processing';
import {
    buildOrderCompletedEvent,
} from '../../events/order-completed';
import {
    buildOrderFailedEvent,
} from '../../events/order-failed';
import { EVENT_BUS_NAME } from '../../events/types';

// ─── EventBridge client singleton ─────────────────────────────────────────────
const eb = new EventBridgeClient({});
const eventBusName = process.env['EVENT_BUS_NAME'] ?? EVENT_BUS_NAME;

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (event: SQSEvent): Promise<void> => {
    console.log('[OrderProcessor] Received batch', JSON.stringify({
        recordCount: event.Records.length,
    }));

    // Process each SQS record sequentially.
    // If any record throws, SQS will retry the entire batch (up to
    // maxReceiveCount=3), then route to the DLQ.
    for (const record of event.Records) {
        await processRecord(record);
    }
};

// ─── Per-record processor ─────────────────────────────────────────────────────

async function processRecord(record: SQSRecord): Promise<void> {
    // SQS body is the EventBridge event envelope.
    // EventBridge wraps the user payload in { detail: <our DomainEvent> }.
    let orderCreatedEvent: OrderCreatedEvent;

    try {
        const sqsBody = JSON.parse(record.body) as {
            detail: OrderCreatedEvent;
        };
        orderCreatedEvent = sqsBody.detail;
    } catch {
        console.error('[OrderProcessor] Failed to parse SQS message body', record.body);
        // Malformed message — throw so it goes to DLQ
        throw new Error('Unparseable SQS message body');
    }

    const { orderId, userId, items, shippingAddress, totalAmount } = orderCreatedEvent.payload;

    console.log('[OrderProcessor] Processing order', JSON.stringify({ orderId, userId }));

    // ── Validate the order still exists and is in PENDING state ───────────────
    const { Item } = await db.send(
        new GetItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ PK: `ORDER#${orderId}`, SK: 'METADATA' }),
        }),
    );

    if (!Item) {
        console.error('[OrderProcessor] Order not found in DynamoDB', { orderId });
        throw new Error(`Order ${orderId} not found`);
    }

    const existingOrder = unmarshall(Item);
    if (existingOrder['status'] !== 'PENDING') {
        console.warn('[OrderProcessor] Order is not in PENDING state — skipping', {
            orderId,
            currentStatus: existingOrder['status'],
        });
        return; // idempotent — already processed
    }

    // ── Step 1: Mark as PROCESSING ────────────────────────────────────────────
    const processingAt = new Date().toISOString();
    await updateOrderStatus(orderId, 'PROCESSING', processingAt);

    await publishEvent(
        'OrderProcessing',
        buildOrderProcessingEvent({
            orderId,
            userId,
            status: 'PROCESSING',
            startedAt: processingAt,
        }),
    );

    // ── Step 2: Fulfilment logic (extensible — plug in inventory/payment here) ─
    try {
        await fulfillOrder({ orderId, userId, items, shippingAddress, totalAmount });
    } catch (err) {
        const failedAt = new Date().toISOString();
        const reason = err instanceof Error ? err.message : String(err);

        console.error('[OrderProcessor] Fulfilment failed', { orderId, reason });

        await updateOrderStatus(orderId, 'FAILED', failedAt);

        await publishEvent(
            'OrderFailed',
            buildOrderFailedEvent({
                orderId,
                userId,
                status: 'FAILED',
                reason,
                failedAt,
            }),
        );

        // Re-throw so SQS increments the receive count toward DLQ threshold
        throw err;
    }

    // ── Step 3: Mark as COMPLETED ─────────────────────────────────────────────
    const completedAt = new Date().toISOString();
    await updateOrderStatus(orderId, 'COMPLETED', completedAt);

    await publishEvent(
        'OrderCompleted',
        buildOrderCompletedEvent({
            orderId,
            userId,
            status: 'COMPLETED',
            completedAt,
        }),
    );

    console.log('[OrderProcessor] Order completed', JSON.stringify({ orderId }));
}

// ─── DynamoDB helpers ─────────────────────────────────────────────────────────

async function updateOrderStatus(
    orderId: string,
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
    timestamp: string,
): Promise<void> {
    await db.send(
        new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ PK: `ORDER#${orderId}`, SK: 'METADATA' }),
            UpdateExpression:
                'SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status',  // 'status' is a reserved word in DynamoDB
            },
            ExpressionAttributeValues: marshall({
                ':status': status,
                ':updatedAt': timestamp,
            }),
            ConditionExpression: 'attribute_exists(PK)',
        }),
    );
}

// ─── EventBridge helper ───────────────────────────────────────────────────────

async function publishEvent(
    detailType: string,
    detail: object,
): Promise<void> {
    await eb.send(
        new PutEventsCommand({
            Entries: [
                {
                    EventBusName: eventBusName,
                    Source: 'ecommerce.order-processor',
                    DetailType: detailType,
                    Detail: JSON.stringify(detail),
                },
            ],
        }),
    );
}

// ─── Fulfilment stub ──────────────────────────────────────────────────────────

/**
 * fulfillOrder — extensible fulfilment hook.
 *
 * In Phase 7 this is where you would:
 *   - Deduct inventory via the Inventory Service
 *   - Charge the payment method via Stripe / Amazon Pay
 *   - Request carrier label generation
 *
 * Today it validates item quantities and prices are positive numbers,
 * which is sufficient to prove the async pipeline end-to-end.
 */
async function fulfillOrder(order: {
    orderId: string;
    userId: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
    shippingAddress: string;
    totalAmount: number;
}): Promise<void> {
    for (const item of order.items) {
        if (item.quantity < 1) {
            throw new Error(`Invalid quantity for product ${item.productId}`);
        }
        if (item.price < 0) {
            throw new Error(`Invalid price for product ${item.productId}`);
        }
    }
    // All items valid — fulfilment succeeds
}
