/**
 * Admin Service
 * Service layer for admin dashboard and management APIs
 */

import { api } from '@lib'
import { Product, Order, User, Analytics, PaginationParams, OrderStatus } from '@types'
import { getMockProducts, getMockOrders, getMockAnalyticsData, getMockCustomers, mockCustomers } from '@mock'
import { MOCK_DELAY } from '@lib'

const simulateDelay = () => new Promise(resolve => setTimeout(resolve, MOCK_DELAY.MEDIUM))

export const adminService = {
    // Dashboard
    async getDashboardMetrics() {
        try {
            await simulateDelay()
            const analyticsData = getMockAnalyticsData()
            const latestAnalytics = analyticsData[analyticsData.length - 1]

            return {
                revenue: latestAnalytics?.totalRevenue || 0,
                orders: latestAnalytics?.totalOrders || 0,
                customers: latestAnalytics?.totalCustomers || 0,
                products: latestAnalytics?.totalProducts || 0,
                conversionRate: latestAnalytics?.conversionRate || 0,
                averageOrderValue: latestAnalytics?.averageOrderValue || 0,
            }

            /* Backend integration:
            const response = await api.get('/admin/dashboard/metrics')
            return response.data
            */
        } catch (error) {
            console.error('Error fetching dashboard metrics:', error)
            throw error
        }
    },

    async getDashboardCharts() {
        try {
            await simulateDelay()
            const analyticsData = getMockAnalyticsData()

            return {
                revenueTrend: analyticsData.map((d: any) => ({
                    date: d.date,
                    totalRevenue: d.totalRevenue,
                })),
                orderTrend: analyticsData.map((d: any) => ({
                    date: d.date,
                    totalOrders: d.totalOrders,
                })),
            }

            /* Backend integration:
            const response = await api.get('/admin/dashboard/charts')
            return response.data
            */
        } catch (error) {
            console.error('Error fetching dashboard charts:', error)
            throw error
        }
    },

    async getRecentActivities(limit: number = 10) {
        try {
            await simulateDelay()

            return [
                { id: '1', type: 'order_created', description: 'Order #ORD-001 created', timestamp: new Date().toISOString() },
                { id: '2', type: 'order_updated', description: 'Order #ORD-002 updated', timestamp: new Date().toISOString() },
            ]

            /* Backend integration:
            const response = await api.get('/admin/activities', { params: { limit } })
            return response.data
            */
        } catch (error) {
            console.error('Error fetching recent activities:', error)
            throw error
        }
    },

    // Products
    async getProducts(params: PaginationParams): Promise<{ data: Product[]; total: number }> {
        try {
            await simulateDelay()
            const result = getMockProducts(params.page, params.pageSize, undefined, params.search)
            return { data: result.data, total: result.total }

            /* Backend integration:
            const response = await api.get('/admin/products', { params })
            return response.data
            */
        } catch (error) {
            console.error('Error fetching admin products:', error)
            throw error
        }
    },

    async createProduct(product: Partial<Product>): Promise<Product> {
        try {
            await simulateDelay()
            // Mock implementation
            const newProduct: Product = {
                id: `prod-${Date.now()}`,
                name: product.name || '',
                description: product.description || '',
                price: product.price || 0,
                category: product.category || 'electronics',
                image: product.image || '',
                images: product.images || [],
                stock: product.stock || 0,
                rating: 0,
                reviews: 0,
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }

            return newProduct

            /* Backend integration:
            const response = await api.post('/admin/products', product)
            return response.data
            */
        } catch (error) {
            console.error('Error creating product:', error)
            throw error
        }
    },

    async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
        try {
            await simulateDelay()
            // Mock implementation
            return product as Product

            /* Backend integration:
            const response = await api.put(`/admin/products/${id}`, product)
            return response.data
            */
        } catch (error) {
            console.error('Error updating product:', error)
            throw error
        }
    },

    async deleteProduct(id: string): Promise<void> {
        try {
            await simulateDelay()

            /* Backend integration:
            await api.delete(`/admin/products/${id}`)
            */
        } catch (error) {
            console.error('Error deleting product:', error)
            throw error
        }
    },

    // Orders
    async getOrders(params: PaginationParams & { status?: OrderStatus }): Promise<{ data: Order[]; total: number }> {
        try {
            await simulateDelay()
            const result = getMockOrders(params.page, params.pageSize, params.status, params.search)
            return { data: result.data, total: result.total }

            /* Backend integration:
            const response = await api.get('/admin/orders', { params })
            return response.data
            */
        } catch (error) {
            console.error('Error fetching admin orders:', error)
            throw error
        }
    },

    async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
        try {
            await simulateDelay()
            // Mock implementation
            return {} as Order

            /* Backend integration:
            const response = await api.put(`/admin/orders/${orderId}`, { status })
            return response.data
            */
        } catch (error) {
            console.error('Error updating order status:', error)
            throw error
        }
    },

    // Customers
    async getCustomers(params: PaginationParams): Promise<{ data: User[]; total: number }> {
        try {
            await simulateDelay()
            const result = getMockCustomers(params.page, params.pageSize, params.search)
            return { data: result.data, total: result.total }

            /* Backend integration:
            const response = await api.get('/admin/customers', { params })
            return response.data
            */
        } catch (error) {
            console.error('Error fetching customers:', error)
            throw error
        }
    },

    async getCustomerDetails(userId: string): Promise<User> {
        try {
            await simulateDelay()
            const customer = mockCustomers.find((c: any) => c.id === userId)
            if (!customer) throw new Error('Customer not found')
            return customer

            /* Backend integration:
            const response = await api.get(`/admin/customers/${userId}`)
            return response.data
            */
        } catch (error) {
            console.error('Error fetching customer details:', error)
            throw error
        }
    },

    // Analytics
    async getAnalytics(): Promise<Analytics[]> {
        try {
            await simulateDelay()
            return getMockAnalyticsData()

            /* Backend integration:
            const response = await api.get('/admin/analytics')
            return response.data
            */
        } catch (error) {
            console.error('Error fetching analytics:', error)
            throw error
        }
    },
}
