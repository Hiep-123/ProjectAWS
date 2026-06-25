/**
 * src/events/order-processing.ts
 *
 * Contract for the OrderProcessing domain event.
 * Published by OrderProcessorFunction once it has begun processing
 * and updated the order status to PROCESSING in DynamoDB.
 */

import type { DomainEvent } from './types';

export interface OrderProcessingPayload {
    orderId: string;
    userId: string;
    status: 'PROCESSING';
    startedAt: string;
}

export type OrderProcessingEvent = DomainEvent<'OrderProcessing', OrderProcessingPayload>;

export function buildOrderProcessingEvent(
    payload: OrderProcessingPayload,
): OrderProcessingEvent {
    return {
        eventType: 'OrderProcessing',
        version: '1',
        timestamp: new Date().toISOString(),
        source: 'ecommerce.order-processor',
        payload,
    };
}
