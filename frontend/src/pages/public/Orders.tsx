import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '@hooks/queries/useOrders'
import PageHeader from '@components/shared/PageHeader'
import StatusBadge from '@components/shared/StatusBadge'
import LoadingSpinner from '@components/shared/LoadingSpinner'
import SearchInput from '@components/shared/SearchInput'
import EmptyState from '@components/shared/EmptyState'
import { Button, Card, CardContent, CardHeader, CardTitle, Separator } from '@components/ui'
import { ShoppingBag, ChevronRight, Calendar, DollarSign, Package } from 'lucide-react'
import { formatCurrency } from '@lib/utils'
import { OrderStatus } from '@types'

// ── Tabs match the real backend demo flow: PENDING → PROCESSING → COMPLETED ──
// "Shipped" and "Cancelled" are removed because the backend never produces them.
const STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
    { label: 'All Orders', value: 'all' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Processing', value: 'Processing' },
    { label: 'Delivered', value: 'Delivered' },
]

const OrdersPage: React.FC = () => {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
    const [page, setPage] = useState(1)
    const PAGE_SIZE = 5

    // ── Fetch ALL user orders once — client-side filtering handles the rest ──
    // GET /orders returns all orders for the authenticated user via GSI2.
    // The backend does not support ?status= filtering, so we fetch everything
    // and filter on the frontend. This is correct for typical demo scale (<20 orders).
    const { data: allOrdersResponse, isLoading, isError, refetch } = useOrders({
        page: 1,
        pageSize: 200,   // large enough to cover all demo orders in one request
    })

    // ── Client-side filter: status tab + search by order ID ─────────────────
    const filteredOrders = useMemo(() => {
        const all = allOrdersResponse?.data ?? []
        return all
            .filter(o => statusFilter === 'all' || o.status === statusFilter)
            .filter(o => !search || o.id.toLowerCase().includes(search.toLowerCase()))
    }, [allOrdersResponse?.data, statusFilter, search])

    // ── Client-side pagination ───────────────────────────────────────────────
    const totalFiltered = filteredOrders.length
    const pagedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const handleClearFilters = () => {
        setSearch('')
        setStatusFilter('all')
        setPage(1)
    }

    return (
        <div className="container py-8 max-w-5xl">
            <PageHeader
                title="Your Orders"
                description="View your order history, trace real-time fulfillment updates, and manage delivery settings"
                breadcrumbs={[{ label: 'Orders' }]}
            />

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 pb-2 border-b">
                <div className="flex flex-wrap gap-1.5">
                    {STATUS_TABS.map((tab) => (
                        <Button
                            key={tab.value}
                            variant={statusFilter === tab.value ? 'default' : 'outline'}
                            onClick={() => { setStatusFilter(tab.value); setPage(1) }}
                            className="text-xs px-3.5 h-8 font-semibold"
                            size="sm"
                        >
                            {tab.label}
                        </Button>
                    ))}
                </div>

                <div className="w-full sm:w-[260px]">
                    <SearchInput
                        value={search}
                        onChange={(val) => { setSearch(val); setPage(1) }}
                        placeholder="Search by Order ID..."
                    />
                </div>
            </div>

            {/* Content List */}
            {isLoading ? (
                <div className="min-h-[40vh] flex-center">
                    <LoadingSpinner label="Retrieving your orders..." />
                </div>
            ) : isError ? (
                <div className="text-center py-12 space-y-4 border border-dashed rounded-lg bg-card/30">
                    <h3 className="text-lg font-bold">Failed to load orders</h3>
                    <p className="text-muted-foreground text-sm">Please refresh to fetch your orders again.</p>
                    <Button onClick={() => refetch()} size="sm">Retry</Button>
                </div>
            ) : pagedOrders.length === 0 ? (
                <EmptyState
                    icon={ShoppingBag}
                    title="No orders found"
                    description="Looks like you don't have any matching orders. Try adjusting filters or search query."
                    action={{
                        label: 'Go Shopping',
                        onClick: () => navigate('/products'),
                    }}
                />
            ) : (
                <div className="space-y-6">
                    {pagedOrders.map((order: any) => (
                        <Card
                            key={order.id}
                            className="border border-border/40 hover:border-border/80 hover:shadow-md transition-all cursor-pointer"
                            onClick={() => navigate(`/orders/${order.id}`)}
                        >
                            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 p-4 sm:px-6">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-semibold">ORDER ID</p>
                                    <p className="font-extrabold text-sm sm:text-base text-foreground font-mono">
                                        {order.id}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={order.status} />
                                    <ChevronRight className="w-5 h-5 text-muted-foreground hidden sm:block" />
                                </div>
                            </CardHeader>

                            <CardContent className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                                    <div>
                                        <p className="text-muted-foreground">DATE PLACED</p>
                                        <p className="text-foreground font-bold mt-0.5">
                                            {new Date(order.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-primary shrink-0" />
                                    <div>
                                        <p className="text-muted-foreground">TOTAL AMOUNT</p>
                                        <p className="text-foreground font-extrabold mt-0.5 text-sm">
                                            {formatCurrency(order.totalAmount)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-primary shrink-0" />
                                    <div>
                                        <p className="text-muted-foreground">ITEMS INCLUDED</p>
                                        <p className="text-foreground font-bold mt-0.5">
                                            {order.items.reduce((sum: any, i: any) => sum + i.quantity, 0)} items
                                        </p>
                                    </div>
                                </div>
                            </CardContent>

                            <Separator />

                            <CardContent className="p-4 sm:px-6 bg-muted/5 flex items-center justify-between gap-4">
                                <span className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                                    {order.items.map((i: any) => i.productName).join(', ')}
                                </span>
                                <Button
                                    variant="link"
                                    className="text-xs font-bold gap-1 text-primary shrink-0 h-auto p-0"
                                >
                                    Details
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Pagination over filtered results */}
                    {totalFiltered > PAGE_SIZE && (
                        <div className="flex items-center justify-between border-t pt-6">
                            <span className="text-sm text-muted-foreground">
                                Showing {(page - 1) * PAGE_SIZE + 1}–
                                {Math.min(page * PAGE_SIZE, totalFiltered)} of {totalFiltered} orders
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page * PAGE_SIZE >= totalFiltered}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default OrdersPage
