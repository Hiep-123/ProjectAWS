/**
 * Product Queries
 * TanStack Query hooks for product-related server state management
 */

import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query'
import { Product, ProductResponse, PaginationParams } from '@types'
import { productService } from '@services'
import { QUERY_KEYS } from '@lib'

interface UseProductsParams extends PaginationParams {
    category?: string
    minPrice?: number
    maxPrice?: number
}

/**
 * Hook to fetch all products with pagination and filters
 */
export const useProducts = (params: UseProductsParams) => {
    return useQuery<ProductResponse, Error>({
        queryKey: [...QUERY_KEYS.PRODUCTS, params],
        queryFn: () => productService.getProducts(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

/**
 * Hook to fetch a single product by ID
 */
export const useProduct = (id: string | undefined) => {
    return useQuery<Product | null, Error>({
        queryKey: id ? QUERY_KEYS.PRODUCT(id) : ['product-undefined'],
        queryFn: () => (id ? productService.getProduct(id) : Promise.resolve(null)),
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes
    })
}

/**
 * Hook to fetch related products
 */
export const useRelatedProducts = (productId: string | undefined) => {
    return useQuery<Product[], Error>({
        queryKey: productId ? ['related-products', productId] : ['related-products-undefined'],
        queryFn: () => (productId ? productService.getRelatedProducts(productId) : Promise.resolve([])),
        enabled: !!productId,
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
    })
}

/**
 * Hook to search products
 */
export const useSearchProducts = (query: string) => {
    return useQuery<Product[], Error>({
        queryKey: ['products-search', query],
        queryFn: () => productService.searchProducts(query),
        enabled: query.trim().length > 0,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    })
}

/**
 * Hook to fetch trending products
 */
export const useTrendingProducts = () => {
    return useQuery<Product[], Error>({
        queryKey: ['trending-products'],
        queryFn: () => productService.getTrendingProducts(),
        staleTime: 15 * 60 * 1000, // 15 minutes
        gcTime: 20 * 60 * 1000, // 20 minutes
    })
}

/**
 * Hook to fetch best sellers
 */
export const useBestSellers = () => {
    return useQuery<Product[], Error>({
        queryKey: ['best-sellers'],
        queryFn: () => productService.getBestSellers(),
        staleTime: 15 * 60 * 1000,
        gcTime: 20 * 60 * 1000,
    })
}

/**
 * Hook to fetch featured products
 */
export const useFeaturedProducts = () => {
    return useQuery<Product[], Error>({
        queryKey: ['featured-products'],
        queryFn: () => productService.getFeaturedProducts(),
        staleTime: 15 * 60 * 1000,
        gcTime: 20 * 60 * 1000,
    })
}

/**
 * Hook to fetch multiple products at once
 */
export const useMultipleProducts = (ids: string[]) => {
    const queries = ids.map(id => ({
        queryKey: QUERY_KEYS.PRODUCT(id),
        queryFn: () => productService.getProduct(id),
    }))

    return useQueries({
        queries: queries.map(q => ({
            ...q,
            staleTime: 10 * 60 * 1000,
        })),
    }) as UseQueryResult<Product | null, Error>[]
}
