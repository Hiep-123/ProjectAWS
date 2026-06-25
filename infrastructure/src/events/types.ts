/**
 * src/events/types.ts
 *
 * Base domain event contract used by all events on EcommerceEventBus.
 *
 * DomainEvent<TType, TPayload> is a generic envelope that carries:
 *   - eventType  — discriminator string (e.g. "OrderCreated")
 *   - version    — schema version, enabling forward compatibility
 *   - timestamp  — ISO-8601 creation time
 *   - source     — producing service identifier
 *   - payload    — strongly-typed event body
 */

export interface DomainEvent<TType extends string, TPayload> {
    readonly eventType: TType;
    readonly version: string;
    readonly timestamp: string;
    readonly source: string;
    readonly payload: TPayload;
}

/** All event types published on EcommerceEventBus */
export type OrderEventType =
    | 'OrderCreated'
    | 'OrderProcessing'
    | 'OrderCompleted'
    | 'OrderFailed';

export const EVENT_SOURCE = {
    ORDERS: 'ecommerce.orders',
    ORDER_PROCESSOR: 'ecommerce.order-processor',
} as const;

export const EVENT_BUS_NAME = process.env['EVENT_BUS_NAME'] ?? 'EcommerceEventBus';
