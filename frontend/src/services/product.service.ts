/**
 * product.service.ts
 *
 * Routing logic:
 *   VITE_ENABLE_MOCKS=true  (default / development) → mock data, no network
 *   VITE_ENABLE_MOCKS=false (production)            → live API Gateway
 *
 * API Gateway routes (public, no auth required):
 *   GET /products             → { items: Product[], count: number }
 *   GET /products?category=X  → same, filtered by category
 *   GET /products/{id}        → Product
 */

import { api } from '@lib'
import { ENV } from '@config/env'
import type { Product, ProductResponse, PaginationParams } from '@types'
import { getMockProducts, getMockProduct, getRelatedProducts } from '@mock/products'
import { MOCK_DELAY } from '@lib/constants'

const USE_MOCKS = ENV.ENABLE_MOCKS

const simulateDelay = () =>
    new Promise(resolve => setTimeout(resolve, MOCK_DELAY.MEDIUM))

// ─── Shape returned by the Lambda ────────────────────────────────────────────
interface LambdaProductListResponse {
    items: Product[]
    count: number
}

export const productService = {
    // ── GET /products ──────────────────────────────────────────────────────
    async getProducts(
        params: PaginationParams & {
            category?: string
            minPrice?: number
            maxPrice?: number
        },
    ): Promise<ProductResponse> {
        if (USE_MOCKS) {
            await simulateDelay()
            const { page = 1, pageSize = 12, category, search } = params
            const result = getMockProducts(page, pageSize, category, search)
            if (params.minPrice || params.maxPrice) {
                result.data = result.data.filter(p =>
                    (!params.minPrice || p.price >= params.minPrice!) &&
                    (!params.maxPrice || p.price <= params.maxPrice!),
                )
            }
            return result
        }

        const queryParams: Record<string, string | number> = {}
        if (params.category) queryParams['category'] = params.category

        const { data } = await api.get<LambdaProductListResponse>('/products', {
            params: queryParams,
        })

        return {
            data: data.items,
            total: data.count,
            page: params.page ?? 1,
            pageSize: params.pageSize ?? data.count,
        }
    },

    // ── GET /products/{id} ─────────────────────────────────────────────────
    async getProduct(id: string): Promise<Product | null> {
        if (USE_MOCKS) {
            await simulateDelay()
            const product = getMockProduct(id)
            if (!product) throw new Error(`Product with ID ${id} not found`)
            return product
        }

        const { data } = await api.get<Product>(`/products/${id}`)
        return data
    },

    // ── Related products (mock-only — no backend endpoint yet) ────────────
    async getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
        await simulateDelay()
        return getRelatedProducts(productId, limit)
    },

    // ── Search (mock-only — backend uses ?category= for now) ──────────────
    async searchProducts(query: string): Promise<Product[]> {
        await simulateDelay()
        const { data } = getMockProducts(1, 100, undefined, query)
        return data
    },

    // ── Derived lists — always use mock until dedicated endpoints exist ────
    async getTrendingProducts(limit = 8): Promise<Product[]> {
        const { data } = await this.getProducts({ page: 1, pageSize: limit * 2 })
        return data.filter(p => p.rating >= 4.5).slice(0, limit)
    },

    async getBestSellers(limit = 8): Promise<Product[]> {
        const { data } = await this.getProducts({ page: 1, pageSize: 100 })
        return [...data].sort((a, b) => b.reviews - a.reviews).slice(0, limit)
    },

    async getFeaturedProducts(limit = 8): Promise<Product[]> {
        const { data } = await this.getProducts({ page: 1, pageSize: limit })
        return data
    },
}
