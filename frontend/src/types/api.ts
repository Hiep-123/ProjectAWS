/**
 * API and Common Type Definitions
 */

export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
    message?: string
    code?: string
}

export interface PaginationParams {
    page: number
    pageSize: number
    search?: string
    sort?: string
    order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
}

export interface ApiError {
    code: string
    message: string
    details?: Record<string, unknown>
    timestamp: string
}

export interface RequestConfig {
    timeout?: number
    retry?: boolean
    retryCount?: number
}

export interface CartItem {
    productId: string
    productName: string
    price: number
    quantity: number
    image: string
}

export interface Cart {
    items: CartItem[]
    total: number
    itemCount: number
    couponCode?: string
    discount?: number
}

export interface Analytics {
    totalRevenue: number
    totalOrders: number
    totalCustomers: number
    totalProducts: number
    averageOrderValue: number
    conversionRate: number
    date: string
}

export interface MonitoringMetrics {
    ordersProcessed: number
    ordersFailed: number
    dlqMessages: number
    queueDepth: number
    eventProcessingTime: number
    lambdaExecutions: number
    lambdaErrors: number
    errorRate: number
    timestamp: string
}

export interface EventBridgeEvent {
    id: string
    source: string
    eventType: string
    payload: Record<string, unknown>
    timestamp: string
    status: 'succeeded' | 'failed' | 'retry'
}

export interface SQSMessage {
    id: string
    body: string
    timestamp: string
    status: 'processing' | 'processed' | 'failed'
    retryCount: number
}

export interface DLQEvent {
    id: string
    originalMessageId: string
    reason: string
    timestamp: string
    payload: Record<string, unknown>
}
