/**
 * order.service.ts
 *
 * Routing logic:
 *   VITE_ENABLE_MOCKS=true  → mock data, no network
 *   VITE_ENABLE_MOCKS=false → live API Gateway (Cognito JWT required)
 *
 * API Gateway routes  (all protected):
 *   POST /orders               body: { items, shippingAddress }
 *                              → 201 created Order
 *   GET  /orders               → { items: Order[], count: number }
 *   GET  /orders/{id}          → Order
 *
 * Note — the Lambda uses a simplified Order model (no billingAddress,
 * deliveryMethod, paymentMethod, shippingCost, tax, discount).
 * Those fields are handled client-side until the checkout Lambda is built.
 */

import { api } from '@lib'
import { ENV } from '@config/env'
import type {
    Order,
    OrderResponse,
    OrderStatus,
    OrderTimeline,
    PaginationParams,
    Checkout,
} from '@types'
import { getMockOrders, getMockOrder, getMockOrderTimeline } from '@mock/orders'
import { MOCK_DELAY, generateId } from '@lib'

const USE_MOCKS = ENV.ENABLE_MOCKS

const simulateDelay = () =>
    new Promise(resolve => setTimeout(resolve, MOCK_DELAY.MEDIUM))

// ─── Shape returned by the Lambda ────────────────────────────────────────────
interface LambdaOrder {
    orderId: string
    userId: string
    items: Array<{ productId: string; quantity: number; price: number }>
    shippingAddress: string
    totalAmount: number
    status: string
    createdAt: string
    updatedAt: string
}

interface LambdaOrderListResponse {
    items: LambdaOrder[]
    count: number
}

// Adapt Lambda shape → full frontend Order type (filling in missing fields
// with sensible defaults until the checkout Lambda exposes them).
const toOrder = (raw: LambdaOrder): Order => ({
    id: raw.orderId,
    userId: raw.userId,
    items: raw.items.map(i => ({
        productId: i.productId,
        productName: i.productId,
        price: i.price,
        quantity: i.quantity,
        total: i.price * i.quantity,
        image: '',
    })),
    // Fix 3 — normalize backend UPPER_CASE statuses to frontend Title-Case.
    // Backend:  PENDING → PROCESSING → COMPLETED → FAILED
    // Frontend: Pending → Processing → Delivered  → Cancelled
    status: normalizeOrderStatus(raw.status),
    totalAmount: raw.totalAmount,
    subtotal: raw.totalAmount,
    tax: 0,
    shippingCost: 0,
    discount: 0,
    shippingAddress: typeof raw.shippingAddress === 'string'
        ? {
            id: '',
            name: '',
            street: raw.shippingAddress,
            city: '',
            state: '',
            postalCode: '',
            country: '',
            phone: '',
        }
        : raw.shippingAddress,
    billingAddress: typeof raw.shippingAddress === 'string'
        ? {
            id: '',
            name: '',
            street: raw.shippingAddress,
            city: '',
            state: '',
            postalCode: '',
            country: '',
            phone: '',
        }
        : raw.shippingAddress,
    deliveryMethod: 'standard',
    paymentMethod: 'credit_card',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    estimatedDelivery: new Date(
        new Date(raw.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString(),
})

/**
 * normalizeOrderStatus — maps backend UPPER_CASE values to frontend Title-Case.
 *
 * Backend DynamoDB stores: PENDING | PROCESSING | COMPLETED | FAILED
 * Frontend OrderStatus type: Pending | Processing | Delivered | Cancelled
 *
 * Already-normalized frontend values are passed through unchanged so the
 * function is safe to call on both raw Lambda responses and mock data.
 */
function normalizeOrderStatus(status: string): OrderStatus {
    const map: Record<string, OrderStatus> = {
        // Backend → frontend display mapping (matches real demo flow)
        PENDING: 'Pending',
        PROCESSING: 'Processing',
        COMPLETED: 'Delivered',
        FAILED: 'Cancelled',    // FAILED treated as Cancelled for display
        // Pass-through for already-normalized values (mock data, cached state)
        Pending: 'Pending',
        Processing: 'Processing',
        Delivered: 'Delivered',
        Cancelled: 'Cancelled',
    }
    return map[status] ?? 'Pending'
}

export const orderService = {
    // ── GET /orders ────────────────────────────────────────────────────────
    async getOrders(
        params: PaginationParams & { status?: OrderStatus },
    ): Promise<OrderResponse> {
        if (USE_MOCKS) {
            await simulateDelay()
            const { page = 1, pageSize = 10, status, search } = params
            return getMockOrders(page, pageSize, status, search)
        }

        const { data } = await api.get<LambdaOrderListResponse>('/orders')
        const orders = data.items.map(toOrder)

        return {
            data: orders,
            total: data.count,
            page: params.page ?? 1,
            pageSize: params.pageSize ?? data.count,
        }
    },

    // ── GET /orders/{id} ───────────────────────────────────────────────────
    async getOrder(id: string): Promise<Order | null> {
        if (USE_MOCKS) {
            await simulateDelay()
            const order = getMockOrder(id)
            if (!order) throw new Error(`Order with ID ${id} not found`)
            return order
        }

        const { data } = await api.get<LambdaOrder>(`/orders/${id}`)
        return toOrder(data)
    },

    // Order timeline is mock-only in the current demo build.
    async getOrderTimeline(orderId: string): Promise<OrderTimeline[]> {
        await simulateDelay()
        return getMockOrderTimeline(orderId)
    },

    // ── POST /orders ───────────────────────────────────────────────────────
    async createOrder(checkout: Checkout): Promise<Order> {
        if (USE_MOCKS) {
            await simulateDelay()
            const newOrder: Order = {
                id: generateId('order'),
                userId: 'user-001',
                items: checkout.items,
                status: 'Pending',
                totalAmount:
                    checkout.items.reduce((s: number, i: any) => s + i.total, 0) * 1.08 +
                    (checkout.deliveryMethod === 'overnight' ? 49.99
                        : checkout.deliveryMethod === 'express' ? 24.99
                            : 9.99),
                subtotal: checkout.items.reduce((s: number, i: any) => s + i.total, 0),
                tax: checkout.items.reduce((s: number, i: any) => s + i.total, 0) * 0.08,
                shippingCost: checkout.deliveryMethod === 'overnight' ? 49.99
                    : checkout.deliveryMethod === 'express' ? 24.99
                        : 9.99,
                discount: checkout.couponCode ? 10 : 0,
                couponCode: checkout.couponCode,
                shippingAddress: checkout.shippingAddress,
                billingAddress: checkout.billingAddress,
                deliveryMethod: checkout.deliveryMethod,
                paymentMethod: checkout.paymentMethod,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }
            return newOrder
        }

        // Fix 2 — Lambda returns HTTP 202 with a minimal { message, orderId, status }
        // payload, not a full LambdaOrder. We POST the order, extract the orderId
        // from the 202 response, then immediately GET /orders/{orderId} to obtain
        // the full persisted order object.

        // Lambda expects: { items: [{productId, quantity, price}], shippingAddress }
        const payload = {
            items: checkout.items.map((i: any) => ({
                productId: i.productId,
                quantity: i.quantity,
                price: i.price,
            })),
            shippingAddress:
                typeof checkout.shippingAddress === 'string'
                    ? checkout.shippingAddress
                    : [
                        checkout.shippingAddress.street,
                        checkout.shippingAddress.city,
                        checkout.shippingAddress.state,
                        checkout.shippingAddress.postalCode,
                        checkout.shippingAddress.country,
                    ].join(', '),
            paymentMethod: checkout.paymentMethod,
        }

        // Step 1: POST /orders → 202 { message, orderId, status: 'PENDING' }
        const { data: created } = await api.post<{ message: string; orderId: string; status: string }>(
            '/orders',
            payload,
        )
        const orderId = created.orderId

        // Step 2: GET /orders/{orderId} → full LambdaOrder from DynamoDB
        try {
            const { data: fullOrder } = await api.get<LambdaOrder>(`/orders/${orderId}`)
            return toOrder(fullOrder)
        } catch {
            // Fallback: the GET may fail transiently if the Lambda hasn't
            // finished writing to DynamoDB yet (very unlikely — PutItem happens
            // before the 202 is returned — but safe to handle).
            const now = new Date().toISOString()
            const fallbackShipping = payload.shippingAddress
            return toOrder({
                orderId,
                userId: '',
                items: payload.items,
                shippingAddress: fallbackShipping,
                totalAmount: payload.items.reduce(
                    (sum: number, i: { price: number; quantity: number }) =>
                        sum + i.price * i.quantity,
                    0,
                ),
                status: 'PENDING',
                createdAt: now,
                updatedAt: now,
            })
        }
    },

    // ── Status update & cancel (mock-only — backend is immutable for now) ─
    async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
        await simulateDelay()
        const order = getMockOrder(orderId)
        if (order) {
            order.status = status
            order.updatedAt = new Date().toISOString()
        }
        return order ?? null
    },

    async cancelOrder(orderId: string): Promise<Order | null> {
        return this.updateOrderStatus(orderId, 'Cancelled')
    },

    // ── Coupon validation (mock-only) ──────────────────────────────────────
    async validateCoupon(
        couponCode: string,
    ): Promise<{ valid: boolean; discount: number }> {
        await simulateDelay()
        const validCoupons: Record<string, number> = {
            SAVE10: 10,
            SAVE20: 20,
            WELCOME5: 5,
        }
        const discount = validCoupons[couponCode]
        return { valid: !!discount, discount: discount ?? 0 }
    },
}
