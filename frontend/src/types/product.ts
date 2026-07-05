/**
 * Product Type Definitions
 * Represents product data models for the e-commerce platform
 */

export interface Product {
    id: string
    name: string
    description: string
    price: number
    originalPrice?: number
    category: string
    image: string
    images?: string[]
    stock: number
    rating: number
    reviews: number
    slug?: string        // URL-friendly name — e.g. "probook-x15-laptop"
    sku?: string
    tags?: string[]
    featured?: boolean
    isNew?: boolean
    status?: 'active' | 'inactive' | 'discontinued'
    createdAt?: string
    updatedAt?: string
}

export interface ProductFilter {
    category?: string
    minPrice?: number
    maxPrice?: number
    search?: string
    status?: string
}

export interface ProductSort {
    field: 'price' | 'rating' | 'name' | 'createdAt'
    order: 'asc' | 'desc'
}

export interface ProductResponse {
    data: Product[]
    total: number
    page: number
    pageSize: number
}

export interface ProductDetail extends Product {
    relatedProducts: Product[]
    reviewsList: Review[]
}

export interface Review {
    id: string
    productId: string
    userId: string
    rating: number
    comment: string
    createdAt: string
}
