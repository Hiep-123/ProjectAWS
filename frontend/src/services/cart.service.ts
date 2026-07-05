/**
 * Cart service with mock and live API modes.
 * Cart results are enriched with product names and images when the catalog is available.
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

interface LambdaProductItem {
    productId?: string
    id?: string
    name?: string
    imageUrl?: string
    image?: string
}

interface LambdaProductListResponse {
    items: LambdaProductItem[]
    count: number
}

// Base conversion without enrichment (used as fallback)
const toCartItem = (raw: LambdaCartItem): CartItem => ({
    productId: raw.productId,
    productName: raw.productId,   // overwritten by enrichment below
    price: raw.price,
    quantity: raw.quantity,
    image: '',
})

const buildCart = (items: CartItem[]): Cart => ({
    items,
    total: items.reduce((s, i) => s + i.price * i.quantity, 0),
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
})

/**
 * Enrich cart items with product names and images when the catalog is available.
 * Best-effort: falls back to the product ID if the catalog fetch fails.
 */
async function enrichCartItems(items: CartItem[]): Promise<CartItem[]> {
    if (items.length === 0) return items
    try {
        const { data } = await api.get<LambdaProductListResponse>('/products')
        const productMap = new Map<string, LambdaProductItem>()
        for (const p of data.items) {
            const key = p.productId ?? p.id ?? ''
            if (key) productMap.set(key, p)
        }
        return items.map(item => {
            const p = productMap.get(item.productId)
            if (!p) return item
            return {
                ...item,
                productName: p.name ?? item.productId,
                image: p.image ?? p.imageUrl ?? item.image,
            }
        })
    } catch {
        // Best-effort enrichment — not critical
        return items
    }
}

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
        const baseItems = data.items.map(toCartItem)
        const enriched = await enrichCartItems(baseItems)
        return buildCart(enriched)
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
