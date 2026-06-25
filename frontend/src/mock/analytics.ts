/**
 * Mock Analytics & Monitoring Data
 * Simulated analytics, business metrics, and AWS monitoring data
 */

import { Analytics, MonitoringMetrics, EventBridgeEvent, SQSMessage, DLQEvent } from '@types'

export const mockAnalyticsData: Analytics[] = [
    {
        totalRevenue: 45200,
        totalOrders: 234,
        totalCustomers: 1205,
        totalProducts: 156,
        averageOrderValue: 193.16,
        conversionRate: 3.45,
        date: '2024-06-01',
    },
    {
        totalRevenue: 48900,
        totalOrders: 251,
        totalCustomers: 1289,
        totalProducts: 156,
        averageOrderValue: 194.82,
        conversionRate: 3.62,
        date: '2024-06-02',
    },
    {
        totalRevenue: 42100,
        totalOrders: 218,
        totalCustomers: 1156,
        totalProducts: 156,
        averageOrderValue: 193.12,
        conversionRate: 3.28,
        date: '2024-06-03',
    },
    {
        totalRevenue: 51300,
        totalOrders: 267,
        totalCustomers: 1345,
        totalProducts: 156,
        averageOrderValue: 192.12,
        conversionRate: 3.78,
        date: '2024-06-04',
    },
    {
        totalRevenue: 49800,
        totalOrders: 256,
        totalCustomers: 1401,
        totalProducts: 156,
        averageOrderValue: 194.53,
        conversionRate: 3.54,
        date: '2024-06-05',
    },
    {
        totalRevenue: 55400,
        totalOrders: 287,
        totalCustomers: 1512,
        totalProducts: 156,
        averageOrderValue: 193.03,
        conversionRate: 4.02,
        date: '2024-06-06',
    },
]

export const mockMonitoringMetrics: MonitoringMetrics[] = [
    {
        ordersProcessed: 287,
        ordersFailed: 3,
        dlqMessages: 2,
        queueDepth: 12,
        eventProcessingTime: 156,
        lambdaExecutions: 542,
        lambdaErrors: 8,
        errorRate: 1.47,
        timestamp: new Date().toISOString(),
    },
]

export const mockEventBridgeEvents: EventBridgeEvent[] = [
    {
        id: 'evt-001',
        source: 'order.service',
        eventType: 'OrderCreated',
        payload: { orderId: 'ORD-20240601-ABC123', customerId: 'user-001' },
        timestamp: '2024-06-01T10:30:00Z',
        status: 'succeeded',
    },
    {
        id: 'evt-002',
        source: 'order.service',
        eventType: 'PaymentProcessed',
        payload: { orderId: 'ORD-20240601-ABC123', amount: 389.99 },
        timestamp: '2024-06-01T10:35:00Z',
        status: 'succeeded',
    },
    {
        id: 'evt-003',
        source: 'inventory.service',
        eventType: 'InventoryUpdated',
        payload: { productId: 'prod-001', quantity: -1 },
        timestamp: '2024-06-01T10:40:00Z',
        status: 'succeeded',
    },
    {
        id: 'evt-004',
        source: 'notification.service',
        eventType: 'EmailSent',
        payload: { orderId: 'ORD-20240601-ABC123', email: 'customer@example.com' },
        timestamp: '2024-06-01T10:45:00Z',
        status: 'succeeded',
    },
    {
        id: 'evt-005',
        source: 'shipping.service',
        eventType: 'ShippingInitiated',
        payload: { orderId: 'ORD-20240601-ABC123', carrier: 'FedEx' },
        timestamp: '2024-06-01T11:00:00Z',
        status: 'succeeded',
    },
    {
        id: 'evt-006',
        source: 'order.service',
        eventType: 'OrderCreated',
        payload: { orderId: 'ORD-20240602-DEF456', customerId: 'user-001' },
        timestamp: '2024-06-02T09:15:00Z',
        status: 'retry',
    },
]

export const mockSQSMessages: SQSMessage[] = [
    {
        id: 'msg-001',
        body: 'Order confirmation notification for ORD-20240601-ABC123',
        timestamp: '2024-06-01T10:45:00Z',
        status: 'processed',
        retryCount: 0,
    },
    {
        id: 'msg-002',
        body: 'Inventory update event for product prod-001',
        timestamp: '2024-06-01T10:40:00Z',
        status: 'processed',
        retryCount: 0,
    },
    {
        id: 'msg-003',
        body: 'Shipping notification for order ORD-20240602-DEF456',
        timestamp: '2024-06-02T16:45:00Z',
        status: 'processing',
        retryCount: 0,
    },
    {
        id: 'msg-004',
        body: 'Email delivery notification',
        timestamp: '2024-06-02T10:20:00Z',
        status: 'failed',
        retryCount: 2,
    },
    {
        id: 'msg-005',
        body: 'Customer analytics event',
        timestamp: '2024-06-02T14:30:00Z',
        status: 'processing',
        retryCount: 1,
    },
]

export const mockDLQEvents: DLQEvent[] = [
    {
        id: 'dlq-001',
        originalMessageId: 'msg-004',
        reason: 'Email service timeout - max retries exceeded (3)',
        timestamp: '2024-06-02T10:35:00Z',
        payload: { orderId: 'ORD-20240603-GHI789', email: 'customer@example.com' },
    },
    {
        id: 'dlq-002',
        originalMessageId: 'msg-099',
        reason: 'Invalid message format',
        timestamp: '2024-06-01T15:20:00Z',
        payload: { error: 'Cannot parse JSON' },
    },
]

export const mockMetricsData = [
    { time: '00:00', processing: 120, failed: 2, queue: 5 },
    { time: '04:00', processing: 95, failed: 1, queue: 3 },
    { time: '08:00', processing: 250, failed: 3, queue: 12 },
    { time: '12:00', processing: 380, failed: 5, queue: 28 },
    { time: '16:00', processing: 420, failed: 8, queue: 35 },
    { time: '20:00', processing: 340, failed: 6, queue: 22 },
    { time: '23:59', processing: 180, failed: 2, queue: 8 },
]

export const mockEventBridgeStatus = {
    status: 'healthy',
    eventProcessed: 5420,
    eventsFailed: 12,
    averageLatency: '156ms',
    p99Latency: '2.3s',
}

export const mockInventoryQueueStatus = {
    status: 'healthy',
    messagesInQueue: 12,
    messagesProcessed: 2341,
    averageProcessingTime: '234ms',
    dlqMessages: 2,
}

export const mockEmailQueueStatus = {
    status: 'warning',
    messagesInQueue: 156,
    messagesProcessed: 4521,
    averageProcessingTime: '512ms',
    dlqMessages: 5,
}

export const mockFailedMessages = [
    {
        id: 'msg-004',
        eventType: 'EmailNotification',
        reason: 'Timeout',
        timestamp: '2024-06-02T10:20:00Z',
        retries: 3,
    },
    {
        id: 'msg-156',
        eventType: 'InventoryUpdate',
        reason: 'Database connection failed',
        timestamp: '2024-06-02T14:15:00Z',
        retries: 2,
    },
]

export const getMockAnalyticsData = () => mockAnalyticsData

export const getMockMonitoringMetrics = () => mockMonitoringMetrics[0]

export const getMockEventBridgeEvents = (limit: number = 10) => {
    return mockEventBridgeEvents.slice(0, limit)
}

export const getMockSQSMessages = (limit: number = 10) => {
    return mockSQSMessages.slice(0, limit)
}

export const getMockDLQEvents = (limit: number = 10) => {
    return mockDLQEvents.slice(0, limit)
}
