/**
 * Order Queries
 * TanStack Query hooks for order-related server state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Order, OrderResponse, OrderStatus, OrderTimeline, PaginationParams, Checkout } from '@types'
import { orderService } from '@services'
import { QUERY_KEYS } from '@lib'

interface UseOrdersParams extends PaginationParams {
    status?: OrderStatus
}

/**
 * Hook to fetch all orders with pagination and filters
 */
export const useOrders = (params: UseOrdersParams) => {
    return useQuery<OrderResponse, Error>({
        queryKey: [...QUERY_KEYS.ORDERS, params],
        queryFn: () => orderService.getOrders(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

/**
 * Hook to fetch a single order by ID
 */
export const useOrder = (id: string | undefined) => {
    return useQuery<Order | null, Error>({
        queryKey: id ? QUERY_KEYS.ORDER(id) : ['order-undefined'],
        queryFn: () => (id ? orderService.getOrder(id) : Promise.resolve(null)),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

/**
 * Hook to fetch order timeline
 */
export const useOrderTimeline = (orderId: string | undefined) => {
    return useQuery<OrderTimeline[], Error>({
        queryKey: orderId ? ['order-timeline', orderId] : ['order-timeline-undefined'],
        queryFn: () => (orderId ? orderService.getOrderTimeline(orderId) : Promise.resolve([])),
        enabled: !!orderId,
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
    })
}

/**
 * Hook to create an order
 */
export const useCreateOrder = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (checkout: Checkout) => orderService.createOrder(checkout),
        onSuccess: () => {
            // Invalidate orders queries
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS })
        },
    })
}

/**
 * Hook to update order status
 */
export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
            orderService.updateOrderStatus(orderId, status),
        onSuccess: (data) => {
            if (data) {
                // Invalidate specific order
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDER(data.id) })
                // Invalidate orders list
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS })
            }
        },
    })
}

/**
 * Hook to cancel an order
 */
export const useCancelOrder = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (orderId: string) => orderService.cancelOrder(orderId),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDER(data.id) })
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS })
            }
        },
    })
}

/**
 * Hook to validate coupon
 */
export const useValidateCoupon = () => {
    return useMutation({
        mutationFn: (couponCode: string) => orderService.validateCoupon(couponCode),
    })
}
