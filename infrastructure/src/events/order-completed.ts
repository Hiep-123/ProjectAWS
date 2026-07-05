import type { DomainEvent } from './types';

export interface OrderCompletedPayload {
    orderId: string;
    userId: string;
    status: 'COMPLETED';
    completedAt: string;
}

export type OrderCompletedEvent = DomainEvent<'OrderCompleted', OrderCompletedPayload>;

export function buildOrderCompletedEvent(payload: OrderCompletedPayload): OrderCompletedEvent {
    return {
        eventType: 'OrderCompleted',
        version: '1',
        timestamp: new Date().toISOString(),
        source: 'ecommerce.order-processor',
        payload,
    };
}
