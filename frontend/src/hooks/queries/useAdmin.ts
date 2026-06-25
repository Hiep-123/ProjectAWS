import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@services/admin.service'
import { monitoringService } from '@services/monitoring.service'
import { Product, Order, User, PaginationParams, OrderStatus } from '@types'

export const useAdminDashboardMetrics = () => {
    return useQuery({
        queryKey: ['admin', 'dashboard-metrics'],
        queryFn: () => adminService.getDashboardMetrics(),
    })
}

export const useAdminDashboardCharts = () => {
    return useQuery({
        queryKey: ['admin', 'dashboard-charts'],
        queryFn: () => adminService.getDashboardCharts(),
    })
}

export const useAdminRecentActivities = (limit?: number) => {
    return useQuery({
        queryKey: ['admin', 'recent-activities', limit],
        queryFn: () => adminService.getRecentActivities(limit),
    })
}

export const useAdminProducts = (params: PaginationParams) => {
    return useQuery({
        queryKey: ['admin', 'products', params],
        queryFn: () => adminService.getProducts(params),
    })
}

export const useAdminOrders = (params: PaginationParams & { status?: OrderStatus }) => {
    return useQuery({
        queryKey: ['admin', 'orders', params],
        queryFn: () => adminService.getOrders(params),
    })
}

export const useAdminCustomers = (params: PaginationParams) => {
    return useQuery({
        queryKey: ['admin', 'customers', params],
        queryFn: () => adminService.getCustomers(params),
    })
}

export const useAdminAnalytics = () => {
    return useQuery({
        queryKey: ['admin', 'analytics'],
        queryFn: () => adminService.getAnalytics(),
    })
}

export const useAdminMonitoringMetrics = () => {
    return useQuery({
        queryKey: ['admin', 'monitoring', 'metrics'],
        queryFn: () => monitoringService.getMonitoringMetrics(),
        refetchInterval: 10000, // Refetch every 10s to simulate live AWS monitoring
    })
}

export const useAdminEventBridgeEvents = (limit?: number) => {
    return useQuery({
        queryKey: ['admin', 'monitoring', 'eventbridge', limit],
        queryFn: () => monitoringService.getEventBridgeEvents(limit),
        refetchInterval: 10000,
    })
}

export const useAdminSQSMessages = (limit?: number) => {
    return useQuery({
        queryKey: ['admin', 'monitoring', 'sqs', limit],
        queryFn: () => monitoringService.getSQSMessages(limit),
        refetchInterval: 10000,
    })
}

export const useAdminDLQEvents = (limit?: number) => {
    return useQuery({
        queryKey: ['admin', 'monitoring', 'dlq', limit],
        queryFn: () => monitoringService.getDLQEvents(limit),
        refetchInterval: 15000,
    })
}

export const useAdminFailedMessages = (limit?: number) => {
    return useQuery({
        queryKey: ['admin', 'monitoring', 'failed-messages', limit],
        queryFn: () => monitoringService.getFailedMessages(limit),
    })
}

export const useAdminSystemHealth = () => {
    return useQuery({
        queryKey: ['admin', 'monitoring', 'system-health'],
        queryFn: () => monitoringService.getSystemHealth(),
        refetchInterval: 15000,
    })
}

// Mutations
export const useAdminCreateProduct = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (product: Partial<Product>) => adminService.createProduct(product),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
        },
    })
}

export const useAdminUpdateProduct = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, product }: { id: string; product: Partial<Product> }) =>
            adminService.updateProduct(id, product),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
        },
    })
}

export const useAdminDeleteProduct = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => adminService.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
        },
    })
}

export const useAdminUpdateOrderStatus = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
            adminService.updateOrderStatus(orderId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
        },
    })
}

export const useAdminRetryMessage = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (messageId: string) => monitoringService.retryFailedMessage(messageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'monitoring'] })
        },
    })
}
