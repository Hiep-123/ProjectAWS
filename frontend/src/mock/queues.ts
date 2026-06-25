/**
 * AWS SQS Queue Mock Data
 * Simulates realistic SQS queue metrics and status data
 */

export interface SQSQueue {
    name: string
    url: string
    type: 'STANDARD' | 'FIFO'
    messagesVisible: number
    messagesInFlight: number
    messagesDelayed: number
    approximateAgeOfOldestMessage: number // seconds
    dlqArn?: string
    maxReceiveCount?: number
    visibilityTimeout: number
    status: 'ACTIVE' | 'DRAINING' | 'PAUSED'
    throughput: {
        sent: number
        received: number
        deleted: number
    }
}

export const mockQueues: SQSQueue[] = [
    {
        name: 'ecommerce-order-processing-queue',
        url: 'https://sqs.us-east-1.amazonaws.com/123456789012/ecommerce-order-processing-queue',
        type: 'STANDARD',
        messagesVisible: 45,
        messagesInFlight: 12,
        messagesDelayed: 0,
        approximateAgeOfOldestMessage: 34,
        dlqArn: 'arn:aws:sqs:us-east-1:123456789012:ecommerce-order-processing-dlq',
        maxReceiveCount: 3,
        visibilityTimeout: 300,
        status: 'ACTIVE',
        throughput: { sent: 1204, received: 1192, deleted: 1180 },
    },
    {
        name: 'ecommerce-inventory-update-queue',
        url: 'https://sqs.us-east-1.amazonaws.com/123456789012/ecommerce-inventory-update-queue',
        type: 'STANDARD',
        messagesVisible: 112,
        messagesInFlight: 8,
        messagesDelayed: 2,
        approximateAgeOfOldestMessage: 12,
        dlqArn: 'arn:aws:sqs:us-east-1:123456789012:ecommerce-inventory-update-dlq',
        maxReceiveCount: 5,
        visibilityTimeout: 60,
        status: 'ACTIVE',
        throughput: { sent: 3802, received: 3800, deleted: 3795 },
    },
    {
        name: 'ecommerce-email-notification-queue.fifo',
        url: 'https://sqs.us-east-1.amazonaws.com/123456789012/ecommerce-email-notification-queue.fifo',
        type: 'FIFO',
        messagesVisible: 8,
        messagesInFlight: 2,
        messagesDelayed: 0,
        approximateAgeOfOldestMessage: 5,
        visibilityTimeout: 120,
        status: 'ACTIVE',
        throughput: { sent: 987, received: 987, deleted: 987 },
    },
    {
        name: 'ecommerce-shipment-tracking-queue',
        url: 'https://sqs.us-east-1.amazonaws.com/123456789012/ecommerce-shipment-tracking-queue',
        type: 'STANDARD',
        messagesVisible: 3,
        messagesInFlight: 1,
        messagesDelayed: 0,
        approximateAgeOfOldestMessage: 2,
        dlqArn: 'arn:aws:sqs:us-east-1:123456789012:ecommerce-shipment-tracking-dlq',
        maxReceiveCount: 3,
        visibilityTimeout: 180,
        status: 'ACTIVE',
        throughput: { sent: 812, received: 812, deleted: 810 },
    },
]
