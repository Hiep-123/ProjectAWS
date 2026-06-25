/**
 * src/events/order-created.ts
 *
 * Contract for the OrderCreated domain event.
 * Published by OrderServiceFunction to EcommerceEventBus immediately
 * after a new order is persisted with STATUS = PENDING.
 */

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

/** Factory — use this instead of constructing the object manually. */
export function buildOrderCreatedEvent(
    payload: OrderCreatedPayload,
): OrderCreatedEvent {
    return {
        eventType: 'OrderCreated',
        version: '1',
        timestamp: new Date().toISOString(),
        source: 'ecommerce.orders',
        payload,
    };
}
