import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductCard from '@components/shared/ProductCard'
import { Product } from '@types'

// Mock the contexts
vi.mock('@contexts', () => ({
    useCart: () => ({
        addItem: vi.fn(),
        items: [],
        total: 0,
        itemCount: 0,
    }),
}))

const mockProduct: Product = {
    id: 'prod-001',
    name: 'Wireless Noise-Cancelling Headphones',
    description: 'Premium audio experience',
    price: 299.99,
    originalPrice: 399.99,
    image: 'https://picsum.photos/seed/headphones/400/400',
    category: 'Electronics',
    stock: 15,
    rating: 4.8,
    reviews: 1204,
    sku: 'WNC-001',
    tags: ['wireless', 'audio'],
    featured: true,
    isNew: false,
}

const renderProductCard = (overrides?: Partial<Product>) =>
    render(
        <MemoryRouter>
            <ProductCard product={{ ...mockProduct, ...overrides }} />
        </MemoryRouter>
    )

describe('ProductCard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders product name', () => {
        renderProductCard()
        expect(screen.getByText('Wireless Noise-Cancelling Headphones')).toBeInTheDocument()
    })

    it('renders product price', () => {
        renderProductCard()
        expect(screen.getByText('$299.99')).toBeInTheDocument()
    })

    it('shows discount badge when originalPrice > price', () => {
        renderProductCard()
        expect(screen.getByText('-25%')).toBeInTheDocument()
    })

    it('shows out of stock badge when stock is 0', () => {
        renderProductCard({ stock: 0 })
        expect(screen.getByText('Out of Stock')).toBeInTheDocument()
    })

    it('shows low stock badge when stock <= 5', () => {
        renderProductCard({ stock: 3 })
        expect(screen.getByText('Only 3 left')).toBeInTheDocument()
    })

    it('shows custom badge when provided', () => {
        render(
            <MemoryRouter>
                <ProductCard product={mockProduct} badge="New Arrival" />
            </MemoryRouter>
        )
        expect(screen.getByText('New Arrival')).toBeInTheDocument()
    })

    it('renders product image with correct alt text', () => {
        renderProductCard()
        const img = screen.getByAltText('Wireless Noise-Cancelling Headphones')
        expect(img).toBeInTheDocument()
    })

    it('links to correct product detail page', () => {
        renderProductCard()
        const link = screen.getByRole('link')
        expect(link).toHaveAttribute('href', '/products/prod-001')
    })
})
