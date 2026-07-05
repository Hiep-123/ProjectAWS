import type { DomainEvent } from './types';

export interface OrderCreatedPayload {
    orderId: string;
    userId: string;
    items: Array<{
        productId: string;
        quantity: number;
        price: number;
    }>;
    shippingAddress: string;
    totalAmount: number;
    createdAt: string;
}

export type OrderCreatedEvent = DomainEvent<'OrderCreated', OrderCreatedPayload>;

export function buildOrderCreatedEvent(payload: OrderCreatedPayload): OrderCreatedEvent {
    return {
        eventType: 'OrderCreated',
        version: '1',
        timestamp: new Date().toISOString(),
        source: 'ecommerce.orders',
        payload,
    };
}
