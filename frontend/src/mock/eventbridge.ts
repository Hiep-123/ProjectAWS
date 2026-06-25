/**
 * AWS EventBridge Mock Data
 * Simulates realistic event-driven architecture data
 */

export interface EventBridgeEvent {
    id: string
    source: string
    detailType: string
    detail: Record<string, unknown>
    time: string
    region: string
    status: 'MATCHED' | 'NO_MATCH' | 'FAILED'
    ruleMatched?: string
}

export interface EventBridgeRule {
    name: string
    description: string
    eventPattern: string
    targets: string[]
    state: 'ENABLED' | 'DISABLED'
    matchedCount: number
}

export interface EventBridgeBus {
    name: string
    arn: string
    policy?: string
}

export const mockEventBridgeEvents: EventBridgeEvent[] = [
    {
        id: 'evt-001',
        source: 'ecommerce.orders',
        detailType: 'Order Placed',
        detail: { orderId: 'ORD-1001', customerId: 'USR-42', amount: 299.99 },
        time: new Date(Date.now() - 2 * 60000).toISOString(),
        region: 'us-east-1',
        status: 'MATCHED',
        ruleMatched: 'ProcessNewOrder',
    },
    {
        id: 'evt-002',
        source: 'ecommerce.inventory',
        detailType: 'Inventory Updated',
        detail: { productId: 'PRD-55', quantityChanged: -2, newStock: 48 },
        time: new Date(Date.now() - 5 * 60000).toISOString(),
        region: 'us-east-1',
        status: 'MATCHED',
        ruleMatched: 'UpdateInventoryRule',
    },
    {
        id: 'evt-003',
        source: 'ecommerce.payments',
        detailType: 'Payment Confirmed',
        detail: { paymentId: 'PAY-7890', orderId: 'ORD-1001', method: 'CREDIT_CARD' },
        time: new Date(Date.now() - 8 * 60000).toISOString(),
        region: 'us-east-1',
        status: 'MATCHED',
        ruleMatched: 'PaymentSuccessRule',
    },
    {
        id: 'evt-004',
        source: 'ecommerce.users',
        detailType: 'User Registered',
        detail: { userId: 'USR-99', email: 'newuser@example.com', tier: 'STANDARD' },
        time: new Date(Date.now() - 15 * 60000).toISOString(),
        region: 'us-east-1',
        status: 'NO_MATCH',
    },
    {
        id: 'evt-005',
        source: 'ecommerce.shipping',
        detailType: 'Shipment Dispatched',
        detail: { trackingId: 'TRK-3456', carrier: 'UPS', orderId: 'ORD-998' },
        time: new Date(Date.now() - 30 * 60000).toISOString(),
        region: 'us-east-1',
        status: 'MATCHED',
        ruleMatched: 'ShipmentNotificationRule',
    },
    {
        id: 'evt-006',
        source: 'ecommerce.orders',
        detailType: 'Order Cancelled',
        detail: { orderId: 'ORD-889', reason: 'CUSTOMER_REQUEST', refundAmount: 149.99 },
        time: new Date(Date.now() - 45 * 60000).toISOString(),
        region: 'us-east-1',
        status: 'FAILED',
        ruleMatched: 'CancelOrderRule',
    },
]

export const mockEventBridgeRules: EventBridgeRule[] = [
    {
        name: 'ProcessNewOrder',
        description: 'Triggers Lambda to process newly placed orders.',
        eventPattern: '{"source":["ecommerce.orders"],"detail-type":["Order Placed"]}',
        targets: ['ProcessOrderLambda', 'OrderSQSQueue'],
        state: 'ENABLED',
        matchedCount: 1204,
    },
    {
        name: 'UpdateInventoryRule',
        description: 'Routes inventory update events to the inventory service.',
        eventPattern: '{"source":["ecommerce.inventory"]}',
        targets: ['InventoryLambda'],
        state: 'ENABLED',
        matchedCount: 3802,
    },
    {
        name: 'PaymentSuccessRule',
        description: 'Triggers confirmation email and fulfillment on successful payment.',
        eventPattern: '{"source":["ecommerce.payments"],"detail-type":["Payment Confirmed"]}',
        targets: ['SESEmailLambda', 'FulfillmentSQSQueue'],
        state: 'ENABLED',
        matchedCount: 987,
    },
    {
        name: 'ShipmentNotificationRule',
        description: 'Sends shipping notification to customers.',
        eventPattern: '{"source":["ecommerce.shipping"],"detail-type":["Shipment Dispatched"]}',
        targets: ['ShipmentNotifyLambda'],
        state: 'ENABLED',
        matchedCount: 812,
    },
    {
        name: 'CancelOrderRule',
        description: 'Processes order cancellations and initiates refund.',
        eventPattern: '{"source":["ecommerce.orders"],"detail-type":["Order Cancelled"]}',
        targets: ['RefundProcessorLambda'],
        state: 'ENABLED',
        matchedCount: 43,
    },
]

export const mockEventBridgeBuses: EventBridgeBus[] = [
    { name: 'ecommerce-main-bus', arn: 'arn:aws:events:us-east-1:123456789012:event-bus/ecommerce-main-bus' },
    { name: 'default', arn: 'arn:aws:events:us-east-1:123456789012:event-bus/default' },
]
