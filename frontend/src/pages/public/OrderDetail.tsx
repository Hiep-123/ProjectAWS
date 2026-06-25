import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOrder, useOrderTimeline, useCancelOrder } from '@hooks/queries/useOrders'
import PageHeader from '@components/shared/PageHeader'
import StatusBadge from '@components/shared/StatusBadge'
import LoadingSpinner from '@components/shared/LoadingSpinner'
import ConfirmDialog from '@components/shared/ConfirmDialog'
import { Button, Card, CardContent, CardHeader, CardTitle, Separator } from '@components/ui'
import { Calendar, DollarSign, Package, MapPin, CreditCard, ArrowLeft, Ban, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@lib/utils'

const OrderDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)

    const { data: order, isLoading: orderLoading, isError: orderError } = useOrder(id)
    const { data: timeline, isLoading: timelineLoading } = useOrderTimeline(id)
    const { mutate: cancelOrder, isPending: cancelPending } = useCancelOrder()

    if (orderLoading) {
        return (
            <div className="min-h-[60vh] flex-center">
                <LoadingSpinner label="Retrieving order details..." />
            </div>
        )
    }

    if (orderError || !order) {
        return (
            <div className="container py-16 text-center space-y-4 max-w-md">
                <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
                <h2 className="text-2xl font-bold">Order Not Found</h2>
                <p className="text-muted-foreground text-sm">
                    The requested order could not be located on our AWS servers.
                </p>
                <Button onClick={() => navigate('/orders')} className="w-full">
                    Back to Orders
                </Button>
            </div>
        )
    }

    const handleCancelOrder = () => {
        cancelOrder(order.id)
    }

    // List of standard status flow for event driven architecture to show current progress
    const flowStatuses = ['Pending', 'Processing', 'Inventory Updated', 'Email Sent', 'Shipped', 'Delivered']
    const activeIndex = flowStatuses.indexOf(order.status)

    return (
        <div className="container py-8 max-w-5xl">
            <PageHeader
                title={`Order Details`}
                breadcrumbs={[
                    { label: 'Orders', href: '/orders' },
                    { label: order.id },
                ]}
            >
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/orders')} className="gap-1 text-xs">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Orders
                    </Button>
                    {order.status === 'Pending' && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setConfirmCancelOpen(true)}
                            className="gap-1 text-xs"
                        >
                            <Ban className="w-4 h-4" />
                            Cancel Order
                        </Button>
                    )}
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Timeline and Order Items */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Event-driven Architecture status stepper */}
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center justify-between">
                                <span>Order Lifecycle Events</span>
                                <StatusBadge status={order.status} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {order.status === 'Cancelled' ? (
                                <div className="p-4 bg-destructive/10 text-destructive border rounded-lg flex items-center gap-3 text-xs font-semibold">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span>This order was cancelled by the customer or our automated inventory processing system.</span>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Stepper */}
                                    <div className="relative pl-6 border-l-2 border-primary/20 space-y-8">
                                        {timeline?.map((event, idx) => (
                                            <div key={idx} className="relative group">
                                                {/* Bullet */}
                                                <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-background transition-colors ${
                                                    event.status === order.status
                                                        ? 'border-primary bg-primary animate-pulse'
                                                        : 'border-primary bg-primary/40'
                                                }`} />

                                                <div className="space-y-1 text-xs">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="font-extrabold text-foreground">{event.status}</span>
                                                        <span className="text-muted-foreground font-medium">
                                                            {new Date(event.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-muted-foreground font-semibold text-xs leading-snug">
                                                        {event.description}
                                                    </p>
                                                    {event.eventId && (
                                                        <p className="text-[10px] text-primary/70 font-bold font-mono">
                                                            Event ID: {event.eventId}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Items Table */}
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                                <Package className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-lg font-bold">Items Purchased</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {order.items.map((item: any) => (
                                <div key={item.productId} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                    <div className="space-y-0.5 text-xs font-semibold">
                                        <p className="text-foreground text-sm font-bold">{item.productName}</p>
                                        <p className="text-muted-foreground font-semibold font-mono text-[10px]">
                                            ID: {item.productId}
                                        </p>
                                    </div>
                                    <div className="text-right text-xs font-semibold">
                                        <p className="text-foreground font-bold">{formatCurrency(item.price)} × {item.quantity}</p>
                                        <p className="text-primary font-extrabold mt-0.5">{formatCurrency(item.total)}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Delivery details and Summary panel */}
                <div className="space-y-6">
                    {/* Customer addresses */}
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-base font-bold">Delivery Addresses</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-xs font-semibold">
                            <div>
                                <p className="text-muted-foreground">SHIPPING TO</p>
                                <p className="text-foreground font-extrabold mt-0.5">{order.shippingAddress.name}</p>
                                <p className="text-muted-foreground font-medium">
                                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                                </p>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-muted-foreground">BILLING TO</p>
                                <p className="text-foreground font-extrabold mt-0.5">{order.billingAddress.name}</p>
                                <p className="text-muted-foreground font-medium">
                                    {order.billingAddress.street}, {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}, {order.billingAddress.country}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary cost */}
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                                <CreditCard className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-base font-bold">Total Cost Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs font-semibold text-muted-foreground">
                            <div className="flex justify-between">
                                <span className="font-medium text-muted-foreground">Subtotal</span>
                                <span className="text-foreground font-bold">{formatCurrency(order.subtotal)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-green-600 font-bold">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(order.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="font-medium text-muted-foreground">Shipping Cost ({order.deliveryMethod})</span>
                                <span className="text-foreground font-bold">{formatCurrency(order.shippingCost)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium text-muted-foreground">Estimated Tax</span>
                                <span className="text-foreground font-bold">{formatCurrency(order.tax)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-sm font-extrabold text-foreground">
                                <span>Grand Total</span>
                                <span className="text-primary">{formatCurrency(order.totalAmount)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Cancel Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmCancelOpen}
                onOpenChange={setConfirmCancelOpen}
                title="Cancel Order"
                description={`Are you sure you want to cancel order ${order.id}? This action cannot be undone and will immediately request rollback events across our microservices.`}
                onConfirm={handleCancelOrder}
                confirmText="Cancel Order"
                variant="destructive"
                isLoading={cancelPending}
            />
        </div>
    )
}

export default OrderDetailPage
