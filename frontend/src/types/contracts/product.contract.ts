import { Product } from '../product'

export interface GetProductsRequest {
    category?: string
    page?: number
    limit?: number
    search?: string
}

export interface GetProductsResponse {
    items: Product[]
    total: number
    page: number
    totalPages: number
}

export interface GetProductResponse {
    product: Product
}

export interface GetProductRecommendationsRequest {
    productId: string
    limit?: number
}

export interface GetProductRecommendationsResponse {
    recommendations: Product[]
}
