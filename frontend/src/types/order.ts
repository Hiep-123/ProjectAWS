/**
 * Order Type Definitions
 * Represents order data models and event-driven status tracking
 */

import { Address } from './user'

export type OrderStatus =
    | 'Pending'
    | 'Processing'
    | 'Delivered'
    | 'Cancelled'           // legacy — kept for old mock data backward compat

export interface OrderItem {
    productId: string
    productName: string
    quantity: number
    price: number
    total: number
}

export interface Order {
    id: string
    userId: string
    items: OrderItem[]
    status: OrderStatus
    totalAmount: number
    subtotal: number
    tax: number
    shippingCost: number
    discount: number
    couponCode?: string
    shippingAddress: Address
    billingAddress: Address
    deliveryMethod: 'standard' | 'express' | 'overnight'
    paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer'
    createdAt: string
    updatedAt: string
    estimatedDelivery?: string
    trackingNumber?: string
    carrier?: string
}

export interface OrderTimeline {
    status: OrderStatus
    timestamp: string
    description: string
    eventId?: string
}

export interface OrderTracking extends Order {
    timeline: OrderTimeline[]
    carrier?: string
    trackingNumber?: string
}

export interface Checkout {
    items: OrderItem[]
    shippingAddress: Address
    billingAddress: Address
    deliveryMethod: 'standard' | 'express' | 'overnight'
    paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer'
    couponCode?: string
}

export interface OrderResponse {
    data: Order[]
    total: number
    page: number
    pageSize: number
}
