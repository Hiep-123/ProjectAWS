import { Order, OrderTimeline } from '../order'

export interface CreateOrderRequest {
    items: {
        productId: string
        quantity: number
    }[]
    shippingAddress: {
        street: string
        city: string
        state: string
        zipCode: string
        country: string
    }
    paymentMethodId: string
}

export interface CreateOrderResponse {
    orderId: string
    status: string
    estimatedDelivery: string
}

export interface GetOrdersRequest {
    status?: string
    page?: number
    limit?: number
}

export interface GetOrdersResponse {
    items: Order[]
    total: number
    page: number
    totalPages: number
}

export interface GetOrderResponse {
    order: Order
}

export interface GetOrderTimelineResponse {
    events: OrderTimeline[]
}
