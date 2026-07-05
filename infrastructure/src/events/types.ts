// Kiểu event dùng chung cho EventBridge

export interface DomainEvent<TType extends string, TPayload> {
    readonly eventType: TType;
    readonly version: string;
    readonly timestamp: string;
    readonly source: string;
    readonly payload: TPayload;
}

export const EVENT_BUS_NAME = process.env['EVENT_BUS_NAME'] ?? 'EcommerceEventBus';
