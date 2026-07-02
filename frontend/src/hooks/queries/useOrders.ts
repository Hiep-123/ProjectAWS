/**
 * Order Queries
 * TanStack Query hooks for order-related server state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
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

/** Statuses that mean the order has reached a terminal state — polling stops. */
const TERMINAL_STATUSES: OrderStatus[] = ['Delivered', 'Cancelled']

/**
 * Hook to fetch a single order by ID with lightweight status polling.
 *
 * Polling behaviour (live API only — no-ops when mocks are enabled):
 *   - Polls GET /orders/{id} every 3 seconds.
 *   - Automatically stops when the order reaches a terminal status
 *     ('Delivered' = COMPLETED, 'Cancelled' = FAILED) or after 60 seconds.
 *   - Always stops when the component unmounts (interval cleared on cleanup).
 *
 * This lets the Order Detail page reflect async EventBridge processing
 * (PENDING → PROCESSING → COMPLETED) without a page refresh.
 */
export const useOrder = (id: string | undefined) => {
    const queryClient = useQueryClient()
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const elapsedRef = useRef<number>(0)
    const POLL_INTERVAL_MS = 3_000
    const MAX_POLL_MS = 60_000

    const query = useQuery<Order | null, Error>({
        queryKey: id ? QUERY_KEYS.ORDER(id) : ['order-undefined'],
        queryFn: () => (id ? orderService.getOrder(id) : Promise.resolve(null)),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    })

    useEffect(() => {
        if (!id) return

        // Stop any previous interval before starting a new one
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        elapsedRef.current = 0

        const stopPolling = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }

        // Only poll when using the live API (mocks resolve instantly and never change)
        const isMock = import.meta.env['VITE_ENABLE_MOCKS'] !== 'false'
        if (isMock) return

        intervalRef.current = setInterval(() => {
            elapsedRef.current += POLL_INTERVAL_MS

            // Hard timeout — stop after 60 seconds regardless of status
            if (elapsedRef.current >= MAX_POLL_MS) {
                stopPolling()
                return
            }

            // Check current cached status before fetching
            const cached = queryClient.getQueryData<Order | null>(QUERY_KEYS.ORDER(id))
            if (cached && TERMINAL_STATUSES.includes(cached.status)) {
                stopPolling()
                return
            }

            // Invalidate to trigger a background re-fetch
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDER(id) })
        }, POLL_INTERVAL_MS)

        return () => {
            stopPolling()
        }
    }, [id, queryClient])

    // Also stop polling once the fetched data reaches a terminal status
    useEffect(() => {
        if (query.data && TERMINAL_STATUSES.includes(query.data.status)) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [query.data])

    return query
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
