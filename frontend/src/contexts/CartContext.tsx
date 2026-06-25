/**
 * Cart Context
 * Shopping cart state management using Context API
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CartItem } from '@types'
import { LOCAL_STORAGE_KEYS, calculateOrderTotal, TAX_RATE } from '@lib'

interface CartContextType {
    items: CartItem[]
    addItem: (item: CartItem) => void
    removeItem: (productId: string) => void
    updateItemQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    total: number
    subtotal: number
    tax: number
    itemCount: number
    couponCode?: string
    discount: number
    setCouponCode: (code: string | undefined) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([])
    const [couponCode, setCouponCode] = useState<string | undefined>()

    // Load cart from localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem(LOCAL_STORAGE_KEYS.CART)
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart))
            } catch (err) {
                console.error('Error loading cart from localStorage:', err)
            }
        }
    }, [])

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEYS.CART, JSON.stringify(items))
    }, [items])

    const calculateSubtotal = useCallback(() => {
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }, [items])

    const subtotal = calculateSubtotal()
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100
    const discount = couponCode ? 10 : 0 // Mock discount
    const total = calculateOrderTotal(subtotal, TAX_RATE, 0, discount)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    const addItem = useCallback((newItem: CartItem) => {
        setItems(prevItems => {
            const existingItem = prevItems.find(item => item.productId === newItem.productId)
            if (existingItem) {
                return prevItems.map(item =>
                    item.productId === newItem.productId
                        ? { ...item, quantity: item.quantity + newItem.quantity }
                        : item
                )
            }
            return [...prevItems, newItem]
        })
    }, [])

    const removeItem = useCallback((productId: string) => {
        setItems(prevItems => prevItems.filter(item => item.productId !== productId))
    }, [])

    const updateItemQuantity = useCallback((productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId)
            return
        }
        setItems(prevItems =>
            prevItems.map(item =>
                item.productId === productId ? { ...item, quantity } : item
            )
        )
    }, [removeItem])

    const clearCart = useCallback(() => {
        setItems([])
        setCouponCode(undefined)
    }, [])

    const handleSetCouponCode = useCallback((code: string | undefined) => {
        setCouponCode(code)
    }, [])

    const value: CartContextType = {
        items,
        addItem,
        removeItem,
        updateItemQuantity,
        clearCart,
        total,
        subtotal,
        tax,
        itemCount,
        couponCode,
        discount,
        setCouponCode: handleSetCouponCode,
    }

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

/**
 * Hook to use cart context
 */
export const useCart = () => {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within CartProvider')
    }
    return context
}
