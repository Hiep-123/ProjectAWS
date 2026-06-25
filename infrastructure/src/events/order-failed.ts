/**
 * src/events/order-failed.ts
 *
 * Contract for the OrderFailed domain event.
 * Published by OrderProcessorFunction when processing fails and the
 * order status is updated to FAILED in DynamoDB.
 */

import type { DomainEvent } from './types';

export interface OrderFailedPayload {
    orderId: string;
    userId: string;
    status: 'FAILED';
    reason: string;
    failedAt: string;
}

export type OrderFailedEvent = DomainEvent<'OrderFailed', OrderFailedPayload>;

export function buildOrderFailedEvent(
    payload: OrderFailedPayload,
): OrderFailedEvent {
    return {
        eventType: 'OrderFailed',
        version: '1',
        timestamp: new Date().toISOString(),
        source: 'ecommerce.order-processor',
        payload,
    };
}
