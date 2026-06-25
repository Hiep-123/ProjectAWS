import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cartService } from '@services/cart.service'
import { CartItem } from '@types'

export const useGetCart = () => {
    return useQuery({
        queryKey: ['cart'],
        queryFn: () => cartService.getCart(),
    })
}

export const useAddToCart = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (item: CartItem) => cartService.addToCart(item),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] })
        },
    })
}

export const useUpdateCartItem = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
            cartService.updateCartItem(productId, quantity),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] })
        },
    })
}

export const useRemoveFromCart = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (productId: string) => cartService.removeFromCart(productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] })
        },
    })
}

export const useClearCart = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: () => cartService.clearCart(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] })
        },
    })
}
