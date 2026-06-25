/**
 * Mock Order Data
 * Simulated order database for development and testing
 */

import { Order, OrderTimeline, OrderStatus } from '@types'

export const mockOrders: Order[] = [
    {
        id: 'ORD-20240601-ABC123',
        userId: 'user-001',
        items: [
            {
                productId: 'prod-001',
                productName: 'Wireless Bluetooth Headphones',
                quantity: 1,
                price: 299.99,
                total: 299.99,
            },
        ],
        status: 'Delivered',
        totalAmount: 389.99,
        subtotal: 299.99,
        tax: 24.00,
        shippingCost: 9.99,
        discount: 0,
        shippingAddress: {
            id: 'addr-001',
            name: 'John Doe',
            street: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'USA',
            phone: '+1-415-555-0132',
            isDefault: true,
        },
        billingAddress: {
            id: 'addr-001',
            name: 'John Doe',
            street: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'USA',
            phone: '+1-415-555-0132',
        },
        deliveryMethod: 'standard',
        paymentMethod: 'credit_card',
        createdAt: '2024-05-25T10:30:00Z',
        updatedAt: '2024-06-01T14:20:00Z',
        estimatedDelivery: '2024-06-01T23:59:59Z',
    },
    {
        id: 'ORD-20240602-DEF456',
        userId: 'user-001',
        items: [
            {
                productId: 'prod-003',
                productName: 'Mechanical Gaming Keyboard',
                quantity: 1,
                price: 149.99,
                total: 149.99,
            },
            {
                productId: 'prod-008',
                productName: 'Portable SSD 1TB',
                quantity: 1,
                price: 89.99,
                total: 89.99,
            },
        ],
        status: 'Shipped',
        totalAmount: 347.98,
        subtotal: 239.98,
        tax: 19.20,
        shippingCost: 0,
        discount: 10,
        couponCode: 'SAVE10',
        shippingAddress: {
            id: 'addr-001',
            name: 'John Doe',
            street: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'USA',
            phone: '+1-415-555-0132',
        },
        billingAddress: {
            id: 'addr-001',
            name: 'John Doe',
            street: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'USA',
            phone: '+1-415-555-0132',
        },
        deliveryMethod: 'express',
        paymentMethod: 'credit_card',
        createdAt: '2024-06-01T09:15:00Z',
        updatedAt: '2024-06-02T16:45:00Z',
        estimatedDelivery: '2024-06-03T23:59:59Z',
        trackingNumber: 'TRACK123456789',
        carrier: 'FedEx',
    },
    {
        id: 'ORD-20240603-GHI789',
        userId: 'user-001',
        items: [
            {
                productId: 'prod-006',
                productName: 'The Art of Clean Code',
                quantity: 2,
                price: 49.99,
                total: 99.98,
            },
        ],
        status: 'Processing',
        totalAmount: 113.98,
        subtotal: 99.98,
        tax: 8.00,
        shippingCost: 9.99,
        discount: 0,
        shippingAddress: {
            id: 'addr-002',
            name: 'Jane Doe',
            street: '456 Oak Avenue',
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90001',
            country: 'USA',
            phone: '+1-213-555-0198',
        },
        billingAddress: {
            id: 'addr-002',
            name: 'Jane Doe',
            street: '456 Oak Avenue',
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90001',
            country: 'USA',
            phone: '+1-213-555-0198',
        },
        deliveryMethod: 'standard',
        paymentMethod: 'paypal',
        createdAt: '2024-06-02T14:20:00Z',
        updatedAt: '2024-06-03T08:30:00Z',
        estimatedDelivery: '2024-06-05T23:59:59Z',
    },
    {
        id: 'ORD-20240604-JKL012',
        userId: 'user-002',
        items: [
            {
                productId: 'prod-010',
                productName: 'Luxury Coffee Maker',
                quantity: 1,
                price: 349.99,
                total: 349.99,
            },
        ],
        status: 'Pending',
        totalAmount: 389.99,
        subtotal: 349.99,
        tax: 28.00,
        shippingCost: 9.99,
        discount: 0,
        shippingAddress: {
            id: 'addr-003',
            name: 'Bob Smith',
            street: '789 Pine Road',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
            phone: '+1-212-555-0147',
        },
        billingAddress: {
            id: 'addr-003',
            name: 'Bob Smith',
            street: '789 Pine Road',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
            phone: '+1-212-555-0147',
        },
        deliveryMethod: 'overnight',
        paymentMethod: 'debit_card',
        createdAt: '2024-06-03T11:45:00Z',
        updatedAt: '2024-06-03T11:45:00Z',
        estimatedDelivery: '2024-06-04T23:59:59Z',
    },
]

export const mockOrderTimelines: Record<string, OrderTimeline[]> = {
    'ORD-20240601-ABC123': [
        {
            status: 'Pending',
            timestamp: '2024-05-25T10:30:00Z',
            description: 'Order received and confirmed',
            eventId: 'evt-001',
        },
        {
            status: 'Processing',
            timestamp: '2024-05-25T11:00:00Z',
            description: 'Order is being prepared for shipment',
            eventId: 'evt-002',
        },
        {
            status: 'Inventory Updated',
            timestamp: '2024-05-25T12:00:00Z',
            description: 'Inventory updated - Item in stock confirmed',
            eventId: 'evt-003',
        },
        {
            status: 'Email Sent',
            timestamp: '2024-05-25T12:15:00Z',
            description: 'Confirmation email sent to customer',
            eventId: 'evt-004',
        },
        {
            status: 'Shipped',
            timestamp: '2024-05-26T08:00:00Z',
            description: 'Package shipped via FedEx',
            eventId: 'evt-005',
        },
        {
            status: 'Delivered',
            timestamp: '2024-06-01T14:20:00Z',
            description: 'Package delivered successfully',
            eventId: 'evt-006',
        },
    ],
    'ORD-20240602-DEF456': [
        {
            status: 'Pending',
            timestamp: '2024-06-01T09:15:00Z',
            description: 'Order received and confirmed',
            eventId: 'evt-007',
        },
        {
            status: 'Processing',
            timestamp: '2024-06-01T10:00:00Z',
            description: 'Order is being prepared for shipment',
            eventId: 'evt-008',
        },
        {
            status: 'Inventory Updated',
            timestamp: '2024-06-01T10:30:00Z',
            description: 'Inventory updated - All items in stock confirmed',
            eventId: 'evt-009',
        },
        {
            status: 'Email Sent',
            timestamp: '2024-06-01T10:45:00Z',
            description: 'Confirmation email sent to customer',
            eventId: 'evt-010',
        },
        {
            status: 'Shipped',
            timestamp: '2024-06-02T16:45:00Z',
            description: 'Package shipped via FedEx Express',
            eventId: 'evt-011',
        },
    ],
}

export const getMockOrders = (
    page: number = 1,
    pageSize: number = 10,
    status?: OrderStatus,
    search?: string
) => {
    let filtered = mockOrders

    if (status) {
        filtered = filtered.filter(o => o.status === status)
    }

    if (search) {
        const searchLower = search.toLowerCase()
        filtered = filtered.filter(o =>
            o.id.toLowerCase().includes(searchLower) ||
            o.items.some(item =>
                item.productName.toLowerCase().includes(searchLower)
            )
        )
    }

    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedOrders = filtered.slice(start, end)

    return {
        data: paginatedOrders,
        total: filtered.length,
        page,
        pageSize,
    }
}

export const getMockOrder = (id: string) => {
    return mockOrders.find(o => o.id === id)
}

export const getMockOrderTimeline = (orderId: string): OrderTimeline[] => {
    return mockOrderTimelines[orderId] || []
}
