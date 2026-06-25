import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCart } from '@contexts'
import { useCreateOrder } from '@hooks/queries/useOrders'
import { useToast } from '@hooks/use-toast'
import PageHeader from '@components/shared/PageHeader'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Separator, Label } from '@components/ui'
import { Truck, CreditCard, ShoppingBag, ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@lib/utils'

const checkoutSchema = z.object({
    shippingName: z.string().min(2, 'Full name is required'),
    shippingStreet: z.string().min(5, 'Street address is required'),
    shippingCity: z.string().min(2, 'City is required'),
    shippingState: z.string().min(2, 'State is required'),
    shippingPostalCode: z.string().min(5, 'Postal code is required (min 5 digits)'),
    shippingCountry: z.string().min(2, 'Country is required'),
    shippingPhone: z.string().min(10, 'Valid phone number is required'),

    sameAsShipping: z.boolean().default(true),

    billingName: z.string().optional(),
    billingStreet: z.string().optional(),
    billingCity: z.string().optional(),
    billingState: z.string().optional(),
    billingPostalCode: z.string().optional(),
    billingCountry: z.string().optional(),
    billingPhone: z.string().optional(),

    deliveryMethod: z.enum(['standard', 'express', 'overnight']),
    paymentMethod: z.enum(['credit_card', 'paypal', 'bank_transfer']),
    cardNumber: z.string().regex(/^\d{16}$/, 'Must be a valid 16-digit card number').optional().or(z.literal('')),
    cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format MM/YY').optional().or(z.literal('')),
    cardCvv: z.string().regex(/^\d{3,4}$/, '3 or 4 digits').optional().or(z.literal('')),
})

type CheckoutFormValues = z.infer<typeof checkoutSchema>

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate()
    const { items, subtotal, tax, total, discount, couponCode, clearCart } = useCart()
    const { mutate: createOrder, isPending } = useCreateOrder()
    const { toast } = useToast()
    const [sameAddress, setSameAddress] = useState(true)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            sameAsShipping: true,
            deliveryMethod: 'standard',
            paymentMethod: 'credit_card',
            cardNumber: '',
            cardExpiry: '',
            cardCvv: '',
        },
    })

    const watchPaymentMethod = watch('paymentMethod')

    if (items.length === 0) {
        return (
            <div className="container py-16 text-center space-y-4 max-w-md">
                <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground" />
                <h2 className="text-2xl font-bold">Your Cart is Empty</h2>
                <p className="text-muted-foreground text-sm">
                    Add items to your cart before proceeding to checkout.
                </p>
                <Button onClick={() => navigate('/products')} className="w-full">
                    Shop Now
                </Button>
            </div>
        )
    }

    const onSubmit = (values: CheckoutFormValues) => {
        const orderItems = items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
        }))

        const shippingAddress = {
            id: `addr-${Date.now()}`,
            name: values.shippingName,
            street: values.shippingStreet,
            city: values.shippingCity,
            state: values.shippingState,
            postalCode: values.shippingPostalCode,
            country: values.shippingCountry,
            phone: values.shippingPhone,
        }

        const billingAddress = values.sameAsShipping
            ? shippingAddress
            : {
                  id: `addr-bill-${Date.now()}`,
                  name: values.billingName || values.shippingName,
                  street: values.billingStreet || values.shippingStreet,
                  city: values.billingCity || values.shippingCity,
                  state: values.billingState || values.shippingState,
                  postalCode: values.billingPostalCode || values.shippingPostalCode,
                  country: values.billingCountry || values.shippingCountry,
                  phone: values.billingPhone || values.shippingPhone,
              }

        createOrder(
            {
                items: orderItems,
                shippingAddress,
                billingAddress,
                deliveryMethod: values.deliveryMethod,
                paymentMethod: values.paymentMethod === 'credit_card' ? 'credit_card' : 'paypal',
                couponCode,
            },
            {
                onSuccess: (newOrder: any) => {
                    toast({
                        title: 'Order Placed!',
                        description: `Your order ${newOrder.id} has been created successfully.`,
                    })
                    clearCart()
                    navigate(`/orders/${newOrder.id}`)
                },
                onError: (err) => {
                    toast({
                        title: 'Error placing order',
                        description: err.message,
                        variant: 'destructive',
                    })
                },
            }
        )
    }

    return (
        <div className="container py-8 max-w-7xl">
            <PageHeader
                title="Checkout"
                breadcrumbs={[
                    { label: 'Cart', href: '/cart' },
                    { label: 'Checkout' },
                ]}
            />

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Billing & Shipping Fields */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Shipping Address */}
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                                <Truck className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-lg font-bold">Shipping Address</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-1">
                                <Label htmlFor="shippingName">Full Name</Label>
                                <Input id="shippingName" {...register('shippingName')} placeholder="John Doe" />
                                {errors.shippingName && (
                                    <p className="text-xs text-destructive">{errors.shippingName.message}</p>
                                )}
                            </div>

                            <div className="md:col-span-2 space-y-1">
                                <Label htmlFor="shippingStreet">Address Street</Label>
                                <Input id="shippingStreet" {...register('shippingStreet')} placeholder="123 AWS Blvd" />
                                {errors.shippingStreet && (
                                    <p className="text-xs text-destructive">{errors.shippingStreet.message}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="shippingCity">City</Label>
                                <Input id="shippingCity" {...register('shippingCity')} placeholder="Seattle" />
                                {errors.shippingCity && (
                                    <p className="text-xs text-destructive">{errors.shippingCity.message}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="shippingState">State / Province</Label>
                                <Input id="shippingState" {...register('shippingState')} placeholder="WA" />
                                {errors.shippingState && (
                                    <p className="text-xs text-destructive">{errors.shippingState.message}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="shippingPostalCode">ZIP / Postal Code</Label>
                                <Input id="shippingPostalCode" {...register('shippingPostalCode')} placeholder="98101" />
                                {errors.shippingPostalCode && (
                                    <p className="text-xs text-destructive">{errors.shippingPostalCode.message}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="shippingCountry">Country</Label>
                                <Input id="shippingCountry" {...register('shippingCountry')} placeholder="United States" />
                                {errors.shippingCountry && (
                                    <p className="text-xs text-destructive">{errors.shippingCountry.message}</p>
                                )}
                            </div>

                            <div className="md:col-span-2 space-y-1">
                                <Label htmlFor="shippingPhone">Phone Number</Label>
                                <Input id="shippingPhone" {...register('shippingPhone')} placeholder="+1 (206) 555-0100" />
                                {errors.shippingPhone && (
                                    <p className="text-xs text-destructive">{errors.shippingPhone.message}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping Method */}
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                                <Truck className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-lg font-bold">Delivery Method</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <label className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer">
                                <input type="radio" value="standard" {...register('deliveryMethod')} className="accent-primary" />
                                <div className="text-xs">
                                    <p className="font-bold">Standard Delivery</p>
                                    <p className="text-muted-foreground">5-7 business days</p>
                                    <p className="text-green-600 font-semibold mt-1">FREE</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer">
                                <input type="radio" value="express" {...register('deliveryMethod')} className="accent-primary" />
                                <div className="text-xs">
                                    <p className="font-bold">Express Delivery</p>
                                    <p className="text-muted-foreground">2-3 business days</p>
                                    <p className="text-primary font-semibold mt-1">$24.99</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer">
                                <input type="radio" value="overnight" {...register('deliveryMethod')} className="accent-primary" />
                                <div className="text-xs">
                                    <p className="font-bold">Overnight Shipping</p>
                                    <p className="text-muted-foreground">Next business day</p>
                                    <p className="text-primary font-semibold mt-1">$49.99</p>
                                </div>
                            </label>
                        </CardContent>
                    </Card>

                    {/* Payment details */}
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                                <CreditCard className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-lg font-bold">Payment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 border rounded-md p-3 px-4 cursor-pointer hover:bg-muted/50 flex-1 justify-center">
                                    <input type="radio" value="credit_card" {...register('paymentMethod')} className="accent-primary" />
                                    <span className="text-sm font-semibold">Credit Card</span>
                                </label>
                                <label className="flex items-center gap-2 border rounded-md p-3 px-4 cursor-pointer hover:bg-muted/50 flex-1 justify-center">
                                    <input type="radio" value="paypal" {...register('paymentMethod')} className="accent-primary" />
                                    <span className="text-sm font-semibold">PayPal</span>
                                </label>
                            </div>

                            {watchPaymentMethod === 'credit_card' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                    <div className="md:col-span-3 space-y-1">
                                        <Label htmlFor="cardNumber">Card Number</Label>
                                        <Input id="cardNumber" {...register('cardNumber')} placeholder="4111 2222 3333 4444" />
                                        {errors.cardNumber && (
                                            <p className="text-xs text-destructive">{errors.cardNumber.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="cardExpiry">Expiration Date</Label>
                                        <Input id="cardExpiry" {...register('cardExpiry')} placeholder="MM/YY" />
                                        {errors.cardExpiry && (
                                            <p className="text-xs text-destructive">{errors.cardExpiry.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="cardCvv">CVV</Label>
                                        <Input id="cardCvv" {...register('cardCvv')} placeholder="123" />
                                        {errors.cardCvv && (
                                            <p className="text-xs text-destructive">{errors.cardCvv.message}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {watchPaymentMethod === 'paypal' && (
                                <div className="p-4 bg-muted/30 border border-dashed rounded-lg text-center text-xs text-muted-foreground">
                                    You will be redirected to PayPal's secure portal to authorize payment after clicking Place Order.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Panel */}
                <div className="space-y-6">
                    <Card className="border border-border/40 shadow-sm sticky top-6">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Review Order</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Products summary list */}
                            <div className="max-h-[200px] overflow-y-auto space-y-3 pr-2">
                                {items.map((item: any) => (
                                    <div key={item.productId} className="flex justify-between text-xs font-semibold gap-4">
                                        <span className="text-muted-foreground line-clamp-1">
                                            {item.productName} <span className="text-foreground">× {item.quantity}</span>
                                        </span>
                                        <span className="shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground font-medium">Subtotal</span>
                                <span className="font-bold">{formatCurrency(subtotal)}</span>
                            </div>

                            {discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Promo Discount</span>
                                    <span>-{formatCurrency(discount)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground font-medium">Estimated Tax</span>
                                <span className="font-bold">{formatCurrency(tax)}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground font-medium">Shipping Fee</span>
                                <span className="font-bold text-green-600">FREE</span>
                            </div>

                            <Separator />

                            <div className="flex justify-between text-base font-extrabold text-foreground">
                                <span>Total Amount</span>
                                <span className="text-primary">{formatCurrency(total)}</span>
                            </div>
                        </CardContent>
                        <CardContent className="pt-0">
                            <Button
                                type="submit"
                                className="w-full h-11 text-sm font-semibold rounded-lg shadow-sm"
                                isLoading={isPending}
                            >
                                Place Order
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-xs font-semibold gap-1.5 mt-2 h-9"
                                onClick={() => navigate('/cart')}
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Return to Cart
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    )
}

export default CheckoutPage
