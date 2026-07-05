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
import { buildOrderProcessingEvent } from '../../events/order-processing';
import { buildOrderCompletedEvent } from '../../events/order-completed';
import { buildOrderFailedEvent } from '../../events/order-failed';
import { EVENT_BUS_NAME } from '../../events/types';

const eb = new EventBridgeClient({});
const eventBusName = process.env['EVENT_BUS_NAME'] ?? EVENT_BUS_NAME;

export const handler = async (event: SQSEvent): Promise<void> => {
    console.log('[OrderProcessor] Received batch', JSON.stringify({
        recordCount: event.Records.length,
    }));

    for (const record of event.Records) {
        await processRecord(record);
    }
};

async function processRecord(record: SQSRecord): Promise<void> {
    let orderCreatedEvent: OrderCreatedEvent;

    try {
        // SQS body là EventBridge envelope, event thật nằm trong "detail"
        const sqsBody = JSON.parse(record.body) as { detail: OrderCreatedEvent };
        orderCreatedEvent = sqsBody.detail;
    } catch {
        console.error('[OrderProcessor] Failed to parse SQS message body', record.body);
        throw new Error('Unparseable SQS message body');
    }

    const { orderId, userId, items, shippingAddress, totalAmount } = orderCreatedEvent.payload;

    console.log('[OrderProcessor] Processing order', JSON.stringify({ orderId, userId }));

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
        // Đơn đã được xử lý trước đó, bỏ qua
        console.warn('[OrderProcessor] Order is not in PENDING state — skipping', {
            orderId,
            currentStatus: existingOrder['status'],
        });
        return;
    }

    const processingAt = new Date().toISOString();
    await updateOrderStatus(orderId, 'PROCESSING', processingAt);
    await publishEvent('OrderProcessing', buildOrderProcessingEvent({
        orderId, userId, status: 'PROCESSING', startedAt: processingAt,
    }));

    try {
        await fulfillOrder({ orderId, userId, items, shippingAddress, totalAmount });
    } catch (err) {
        const failedAt = new Date().toISOString();
        const reason = err instanceof Error ? err.message : String(err);

        console.error('[OrderProcessor] Fulfilment failed', { orderId, reason });
        await updateOrderStatus(orderId, 'FAILED', failedAt);
        await publishEvent('OrderFailed', buildOrderFailedEvent({
            orderId, userId, status: 'FAILED', reason, failedAt,
        }));

        throw err;
    }

    const completedAt = new Date().toISOString();
    await updateOrderStatus(orderId, 'COMPLETED', completedAt);
    await publishEvent('OrderCompleted', buildOrderCompletedEvent({
        orderId, userId, status: 'COMPLETED', completedAt,
    }));

    console.log('[OrderProcessor] Order completed', JSON.stringify({ orderId }));
}

async function updateOrderStatus(
    orderId: string,
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
    timestamp: string,
): Promise<void> {
    await db.send(
        new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ PK: `ORDER#${orderId}`, SK: 'METADATA' }),
            UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status', // "status" là reserved word trong DynamoDB
            },
            ExpressionAttributeValues: marshall({
                ':status': status,
                ':updatedAt': timestamp,
            }),
            ConditionExpression: 'attribute_exists(PK)',
        }),
    );
}

async function publishEvent(detailType: string, detail: object): Promise<void> {
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

// Kiểm tra dữ liệu đơn hàng trước khi hoàn tất
// Mở rộng hàm này để thêm logic kiểm tra tồn kho hoặc thanh toán
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
}
