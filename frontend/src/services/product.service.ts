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
    items: LambdaProduct[]
    count: number
}

// Raw DynamoDB item shape from ProductServiceFunction.
// Seed data writes `productId` and `imageUrl`; frontend needs `id` and `image`.
interface LambdaProduct {
    productId?: string
    id?: string
    name: string
    description: string
    price: number
    originalPrice?: number
    category: string
    imageUrl?: string
    image?: string
    images?: string[]
    stock: number
    rating?: number
    reviews?: number
    sku?: string
    tags?: string[]
    featured?: boolean
    isNew?: boolean
    status?: 'active' | 'inactive' | 'discontinued'
    createdAt?: string
    updatedAt?: string
    // DynamoDB table key fields — present in raw response, ignored by frontend
    PK?: string
    SK?: string
    GSI1PK?: string
    GSI1SK?: string
    GSI3PK?: string
    GSI3SK?: string
    slug?: string
}

/**
 * normalizeProduct — maps raw Lambda/DynamoDB item → frontend Product type.
 *
 * Handles two field mismatches:
 *   productId → id      (DynamoDB seed uses productId; frontend type uses id)
 *   imageUrl  → image   (DynamoDB seed uses imageUrl; frontend type uses image)
 *
 * Preserves original fields so downstream code is not broken if it already
 * reads productId or imageUrl directly.
 */
function normalizeProduct(raw: LambdaProduct): import('@types').Product {
    return {
        ...raw,
        id: raw.id ?? raw.productId ?? '',
        image: raw.image ?? raw.imageUrl ?? '',
        rating: raw.rating ?? 0,
        reviews: raw.reviews ?? 0,
        slug: raw.slug,
    } as import('@types').Product
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
        if (params.search) queryParams['search'] = params.search
        if ((params as any).sort) queryParams['sort'] = (params as any).sort
        if (params.maxPrice) queryParams['maxPrice'] = params.maxPrice

        const { data } = await api.get<LambdaProductListResponse>('/products', {
            params: queryParams,
        })

        return {
            data: data.items.map(normalizeProduct),
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

        const { data } = await api.get<LambdaProduct>(`/products/${id}`)
        return normalizeProduct(data)
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
