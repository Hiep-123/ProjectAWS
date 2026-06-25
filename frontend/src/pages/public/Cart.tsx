import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@contexts'
import PageHeader from '@components/shared/PageHeader'
import EmptyState from '@components/shared/EmptyState'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardFooter, Separator } from '@components/ui'
import { Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react'
import { formatCurrency } from '@lib/utils'

const Cart: React.FC = () => {
    const navigate = useNavigate()
    const {
        items,
        updateItemQuantity,
        removeItem,
        clearCart,
        subtotal,
        tax,
        total,
        couponCode,
        discount,
        setCouponCode,
    } = useCart()

    const [promoInput, setPromoInput] = useState(couponCode || '')

    const handleApplyPromo = (e: React.FormEvent) => {
        e.preventDefault()
        if (promoInput.trim().toUpperCase() === 'WELCOME10') {
            setCouponCode('WELCOME10')
        } else {
            alert('Invalid coupon code. Try WELCOME10')
        }
    }

    if (items.length === 0) {
        return (
            <div className="container py-16 max-w-7xl">
                <PageHeader title="Shopping Cart" breadcrumbs={[{ label: 'Cart' }]} />
                <EmptyState
                    icon={ShoppingBag}
                    title="Your cart is empty"
                    description="Looks like you haven't added anything to your cart yet. Browse our products to find the best deals."
                    action={{
                        label: 'Browse Products',
                        onClick: () => navigate('/products'),
                    }}
                />
            </div>
        )
    }

    return (
        <div className="container py-8 max-w-7xl">
            <PageHeader title="Shopping Cart" breadcrumbs={[{ label: 'Cart' }]} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <span className="text-sm font-semibold text-muted-foreground">{items.length} items in cart</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearCart}
                            className="text-destructive hover:bg-destructive/10 text-xs font-semibold gap-1.5"
                        >
                            <Trash2 className="h-4 w-4" />
                            Clear Cart
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {items.map((item) => (
                            <div
                                key={item.productId}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted border">
                                        <img
                                            src={item.image}
                                            alt={item.productName}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <Link
                                            to={`/products/${item.productId}`}
                                            className="font-bold text-foreground hover:text-primary transition-colors text-sm sm:text-base line-clamp-1"
                                        >
                                            {item.productName}
                                        </Link>
                                        <p className="text-sm text-primary font-bold mt-1">
                                            {formatCurrency(item.price)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                                    <div className="flex items-center border rounded-md">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                                        >
                                            -
                                        </Button>
                                        <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                                        >
                                            +
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-sm sm:text-base min-w-[70px] text-right">
                                            {formatCurrency(item.price * item.quantity)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItem(item.productId)}
                                            className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-full hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary Box */}
                <div className="space-y-6">
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground font-medium">Subtotal</span>
                                <span className="font-bold">{formatCurrency(subtotal)}</span>
                            </div>

                            {discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span className="font-medium flex items-center gap-1">
                                        <Tag className="h-3.5 w-3.5" />
                                        Promo Discount
                                    </span>
                                    <span className="font-bold">-{formatCurrency(discount)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground font-medium">Estimated Tax</span>
                                <span className="font-bold">{formatCurrency(tax)}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground font-medium">Shipping</span>
                                <span className="font-bold text-green-600">Free</span>
                            </div>

                            <Separator />

                            <div className="flex justify-between text-base font-extrabold">
                                <span>Estimated Total</span>
                                <span className="text-primary">{formatCurrency(total)}</span>
                            </div>
                        </CardContent>

                        <CardFooter className="flex-col gap-4">
                            <Button
                                onClick={() => navigate('/checkout')}
                                className="w-full h-11 text-sm font-semibold rounded-lg shadow-sm gap-2"
                            >
                                Proceed to Checkout
                                <ArrowRight className="h-4 w-4" />
                            </Button>

                            <Link to="/products" className="text-xs text-muted-foreground hover:text-primary transition-colors text-center w-full block">
                                Continue Shopping
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* Promo Codes */}
                    <Card className="border border-border/40 shadow-sm">
                        <CardContent className="pt-6">
                            <form onSubmit={handleApplyPromo} className="flex gap-2">
                                <div className="relative flex-1">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Promo code (e.g. WELCOME10)"
                                        value={promoInput}
                                        onChange={(e) => setPromoInput(e.target.value)}
                                        className="pl-9 h-10 text-xs"
                                    />
                                </div>
                                <Button type="submit" variant="outline" className="h-10 text-xs font-semibold">
                                    Apply
                                </Button>
                            </form>
                            {couponCode && (
                                <p className="text-xs text-green-600 mt-2 font-medium">
                                    Code <strong>{couponCode}</strong> applied successfully!
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default Cart
