/**
 * AWS SQS Dead Letter Queue (DLQ) Mock Data
 * Simulates realistic DLQ messages for monitoring dashboards
 */

export interface DLQMessage {
    messageId: string
    receiptHandle: string
    queueName: string
    body: string
    errorType: string
    errorMessage: string
    approximateReceiveCount: number
    approximateFirstReceiveTimestamp: string
    sentTimestamp: string
    attributes: Record<string, string>
}

export interface DLQSummary {
    queueName: string
    dlqUrl: string
    messageCount: number
    oldestMessage: string
}

export const mockDLQMessages: DLQMessage[] = [
    {
        messageId: 'dlq-msg-7f4a2c8b',
        receiptHandle: 'AQEBTr3...dlq-handle-001',
        queueName: 'ecommerce-order-processing-dlq',
        body: JSON.stringify({ orderId: 'ORD-8801', customerId: 'USR-14', amount: 549.99 }),
        errorType: 'ProvisionedThroughputExceededException',
        errorMessage: 'DynamoDB write capacity exceeded for Orders table',
        approximateReceiveCount: 3,
        approximateFirstReceiveTimestamp: new Date(Date.now() - 12 * 60000).toISOString(),
        sentTimestamp: new Date(Date.now() - 18 * 60000).toISOString(),
        attributes: { ContentType: 'application/json', MessageGroupId: 'orders' },
    },
    {
        messageId: 'dlq-msg-9e1d3a4f',
        receiptHandle: 'AQEBTr3...dlq-handle-002',
        queueName: 'ecommerce-order-processing-dlq',
        body: JSON.stringify({ orderId: 'ORD-8799', customerId: 'USR-37', amount: 89.50 }),
        errorType: 'ServiceUnavailableException',
        errorMessage: 'Payment service timeout after 30s',
        approximateReceiveCount: 3,
        approximateFirstReceiveTimestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        sentTimestamp: new Date(Date.now() - 60 * 60000).toISOString(),
        attributes: { ContentType: 'application/json' },
    },
    {
        messageId: 'dlq-msg-2b8c1e7a',
        receiptHandle: 'AQEBTr3...dlq-handle-003',
        queueName: 'ecommerce-inventory-update-dlq',
        body: JSON.stringify({ productId: 'PRD-203', quantityDelta: -5, warehouseId: 'WH-01' }),
        errorType: 'ConditionalCheckFailedException',
        errorMessage: 'Stock level would go below zero — inventory conflict detected',
        approximateReceiveCount: 5,
        approximateFirstReceiveTimestamp: new Date(Date.now() - 90 * 60000).toISOString(),
        sentTimestamp: new Date(Date.now() - 110 * 60000).toISOString(),
        attributes: { ContentType: 'application/json', Source: 'InventoryLambda' },
    },
    {
        messageId: 'dlq-msg-4d5f9b3c',
        receiptHandle: 'AQEBTr3...dlq-handle-004',
        queueName: 'ecommerce-shipment-tracking-dlq',
        body: JSON.stringify({ trackingId: 'TRK-44120', carrier: 'FEDEX', orderId: 'ORD-7721' }),
        errorType: 'ExternalApiException',
        errorMessage: 'FedEx tracking API returned HTTP 503 after 3 retries',
        approximateReceiveCount: 3,
        approximateFirstReceiveTimestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        sentTimestamp: new Date(Date.now() - 35 * 60000).toISOString(),
        attributes: { ContentType: 'application/json', Source: 'ShipmentLambda' },
    },
]

export const mockDLQSummaries: DLQSummary[] = [
    {
        queueName: 'ecommerce-order-processing-dlq',
        dlqUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/ecommerce-order-processing-dlq',
        messageCount: 2,
        oldestMessage: new Date(Date.now() - 60 * 60000).toISOString(),
    },
    {
        queueName: 'ecommerce-inventory-update-dlq',
        dlqUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/ecommerce-inventory-update-dlq',
        messageCount: 1,
        oldestMessage: new Date(Date.now() - 110 * 60000).toISOString(),
    },
    {
        queueName: 'ecommerce-shipment-tracking-dlq',
        dlqUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/ecommerce-shipment-tracking-dlq',
        messageCount: 1,
        oldestMessage: new Date(Date.now() - 35 * 60000).toISOString(),
    },
]
