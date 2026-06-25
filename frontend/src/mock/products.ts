/**
 * Mock Product Data
 * Simulated product database for development and testing
 */

import { Product } from '@types'

export const mockProducts: Product[] = [
    {
        id: 'prod-001',
        name: 'Wireless Bluetooth Headphones',
        description: 'Premium wireless headphones with noise cancellation and 30-hour battery life',
        price: 299.99,
        originalPrice: 399.99,
        category: 'electronics',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
            'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop',
        ],
        stock: 45,
        rating: 4.8,
        reviews: 234,
        status: 'active',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
    },
    {
        id: 'prod-002',
        name: '4K Ultra HD Webcam',
        description: 'Professional 4K webcam with auto-focus and crystal clear audio',
        price: 189.99,
        originalPrice: 249.99,
        category: 'electronics',
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=500&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=500&fit=crop',
        ],
        stock: 78,
        rating: 4.6,
        reviews: 156,
        status: 'active',
        createdAt: '2024-02-20T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
    },
    {
        id: 'prod-003',
        name: 'Mechanical Gaming Keyboard',
        description: 'RGB mechanical keyboard with Cherry MX switches and programmable keys',
        price: 149.99,
        category: 'electronics',
        image: 'https://images.unsplash.com/photo-1587829191301-5f11c2b20e75?w=500&h=500&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1587829191301-5f11c2b20e75?w=500&h=500&fit=crop',
        ],
        stock: 92,
        rating: 4.7,
        reviews: 189,
        status: 'active',
        createdAt: '2024-03-10T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
    },
    {
        id: 'prod-004',
        name: 'Premium Cotton T-Shirt',
        description: '100% organic cotton t-shirt with modern fit and sustainable production',
        price: 39.99,
        originalPrice: 59.99,
        category: 'clothing',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
        ],
        stock: 156,
        rating: 4.5,
        reviews: 89,
        status: 'active',
        createdAt: '2024-04-05T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
    },
    {
        id: 'prod-005',
        name: 'Running Shoes Pro',
        description: 'Professional running shoes with advanced cushioning technology',
        price: 129.99,
        originalPrice: 179.99,
        category: 'sports',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop',
        ],
        stock: 203,
        rating: 4.6,
        reviews: 234,
        status: 'active',
        createdAt: '2024-01-20T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
    },
    {
        id: 'prod-006',
        name: 'The Art of Clean Code',
        description: 'Essential guide to writing clean, maintainable code for software developers',
        price: 49.99,
        category: 'books',
        image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=500&h=500&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=500&h=500&fit=crop',
        ],
        stock: 89,
        rating: 4.9,
        reviews: 456,
        status: 'active',
        createdAt: '2024-02-15T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
    },
    {
        id: 'prod-007',
        name: 'Smart Home Hub',
        description: 'Central hub for controlling all your smart home devices seamlessly',
        price: 199.99,
        originalPrice: 279.99,
        category: 'electronics',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop',
        ],
        stock: 67,
        rating: 4.7,
        reviews: 178,
        status: 'active',
        createdAt: '2024-03-25T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
    },
    {
        id: 'prod-008',
        name: 'Portable SSD 1TB',
        description: '1TB portable SSD with blazing fast read/write speeds up to 1050 MB/s',
        price: 89.99,
        originalPrice: 119.99,
        category: 'electronics',
        image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&h=500&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&h=500&fit=crop',
        ],
        stock: 234,
        rating: 4.8,
        reviews: 312,
        status: 'active',
        createdAt: '2024-04-10T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
    },
    {
        id: 'prod-009',
        name: 'Yoga Mat Premium',
        description: 'Non-slip yoga mat with eco-friendly materials and carrying strap',
        price: 59.99,
        originalPrice: 79.99,
        category: 'sports',
        image: 'https://images.unsplash.com/photo-1598105365216-aea75b3b63d0?w=500&h=500&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1598105365216-aea75b3b63d0?w=500&h=500&fit=crop',
        ],
        stock: 145,
        rating: 4.5,
        reviews: 123,
        status: 'active',
        createdAt: '2024-05-01T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
    },
    {
        id: 'prod-010',
        name: 'Luxury Coffee Maker',
        description: 'Professional espresso machine with automatic milk frother',
        price: 349.99,
        category: 'home',
        image: 'https://images.unsplash.com/photo-1559056169-641ef0ac8b55?w=500&h=500&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1559056169-641ef0ac8b55?w=500&h=500&fit=crop',
        ],
        stock: 34,
        rating: 4.9,
        reviews: 267,
        status: 'active',
        createdAt: '2024-05-15T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
    },
    {
        id: 'prod-011',
        name: 'Board Game Collection Set',
        description: 'Complete collection of 5 popular strategy board games',
        price: 119.99,
        originalPrice: 159.99,
        category: 'toys',
        image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=500&h=500&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=500&h=500&fit=crop',
        ],
        stock: 56,
        rating: 4.6,
        reviews: 94,
        status: 'active',
        createdAt: '2024-05-20T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
    },
    {
        id: 'prod-012',
        name: 'Winter Jacket Premium',
        description: 'Waterproof winter jacket with thermal insulation and reflective details',
        price: 179.99,
        originalPrice: 249.99,
        category: 'clothing',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=500&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=500&fit=crop',
        ],
        stock: 89,
        rating: 4.7,
        reviews: 156,
        status: 'active',
        createdAt: '2024-06-01T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
    },
]

// Helper function to get mock products with pagination
export const getMockProducts = (
    page: number = 1,
    pageSize: number = 12,
    category?: string,
    search?: string
) => {
    let filtered = mockProducts

    if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category === category)
    }

    if (search) {
        const searchLower = search.toLowerCase()
        filtered = filtered.filter(
            p =>
                p.name.toLowerCase().includes(searchLower) ||
                p.description.toLowerCase().includes(searchLower)
        )
    }

    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedProducts = filtered.slice(start, end)

    return {
        data: paginatedProducts,
        total: filtered.length,
        page,
        pageSize,
    }
}

// Helper to get a single product by ID
export const getMockProduct = (id: string) => {
    return mockProducts.find(p => p.id === id)
}

// Helper to get related products
export const getRelatedProducts = (productId: string, limit: number = 4) => {
    const product = getMockProduct(productId)
    if (!product) return []

    return mockProducts
        .filter(p => p.category === product.category && p.id !== productId)
        .slice(0, limit)
}
