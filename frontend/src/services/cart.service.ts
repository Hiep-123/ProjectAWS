/**
 * cart.service.ts
 *
 * Routing logic:
 *   VITE_ENABLE_MOCKS=true  → mock (in-memory, no network)
 *   VITE_ENABLE_MOCKS=false → live API Gateway  (Cognito JWT required)
 *
 * API Gateway routes  (all protected):
 *   GET    /cart                     → { items: CartItem[], count: number }
 *   POST   /cart                     → body: { productId, quantity, price }
 *   PUT    /cart                     → body: { productId, quantity }
 *   DELETE /cart/{productId}         → { message: string }
 *
 * The Lambda stores cart items as DynamoDB items keyed by
 * PK=USER#{userId} / SK=CART#{productId}, so there is no server-side
 * Cart aggregate — we reconstruct it on the client.
 */

import { api } from '@lib'
import { ENV } from '@config/env'
import type { Cart, CartItem } from '@types'
import { MOCK_DELAY } from '@lib/constants'

const USE_MOCKS = ENV.ENABLE_MOCKS

const simulateDelay = () =>
    new Promise(resolve => setTimeout(resolve, MOCK_DELAY.MEDIUM))

// ─── Shape stored/returned by the Lambda ──────────────────────────────────────
interface LambdaCartItem {
    userId: string
    productId: string
    quantity: number
    price: number
    createdAt: string
    updatedAt: string
}

interface LambdaCartListResponse {
    items: LambdaCartItem[]
    count: number
}

// Convert Lambda item → frontend CartItem (adds productName/image placeholders
// until a product-enrichment step joins against the product catalog).
const toCartItem = (raw: LambdaCartItem): CartItem => ({
    productId: raw.productId,
    productName: raw.productId,   // enriched by the calling UI layer if needed
    price: raw.price,
    quantity: raw.quantity,
    image: '',
})

const buildCart = (items: CartItem[]): Cart => ({
    items,
    total: items.reduce((s, i) => s + i.price * i.quantity, 0),
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
})

// ─── In-memory mock store ─────────────────────────────────────────────────────
let mockCart: CartItem[] = []

export const cartService = {
    // ── GET /cart ──────────────────────────────────────────────────────────
    async getCart(): Promise<Cart> {
        if (USE_MOCKS) {
            await simulateDelay()
            return buildCart(mockCart)
        }

        const { data } = await api.get<LambdaCartListResponse>('/cart')
        return buildCart(data.items.map(toCartItem))
    },

    // ── POST /cart ─────────────────────────────────────────────────────────
    async addToCart(item: CartItem): Promise<Cart> {
        if (USE_MOCKS) {
            await simulateDelay()
            const existing = mockCart.findIndex(i => i.productId === item.productId)
            if (existing >= 0) {
                mockCart[existing]!.quantity += item.quantity
            } else {
                mockCart.push({ ...item })
            }
            return buildCart(mockCart)
        }

        await api.post('/cart', {
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
        })
        return this.getCart()
    },

    // ── PUT /cart ──────────────────────────────────────────────────────────
    async updateCartItem(productId: string, quantity: number): Promise<Cart> {
        if (USE_MOCKS) {
            await simulateDelay()
            const idx = mockCart.findIndex(i => i.productId === productId)
            if (idx >= 0) mockCart[idx]!.quantity = quantity
            return buildCart(mockCart)
        }

        await api.put('/cart', { productId, quantity })
        return this.getCart()
    },

    // ── DELETE /cart/{productId} ───────────────────────────────────────────
    async removeFromCart(productId: string): Promise<Cart> {
        if (USE_MOCKS) {
            await simulateDelay()
            mockCart = mockCart.filter(i => i.productId !== productId)
            return buildCart(mockCart)
        }

        await api.delete(`/cart/${productId}`)
        return this.getCart()
    },

    // ── Clear (mock: wipe local; real: delete each item) ──────────────────
    async clearCart(): Promise<Cart> {
        if (USE_MOCKS) {
            await simulateDelay()
            mockCart = []
            return buildCart([])
        }

        const current = await this.getCart()
        await Promise.all(
            current.items.map(i => api.delete(`/cart/${i.productId}`)),
        )
        return buildCart([])
    },
}
