import React, { useState } from 'react'
import { useAdminOrders, useAdminUpdateOrderStatus } from '@hooks/queries/useAdmin'
import PageHeader from '@components/shared/PageHeader'
import LoadingSpinner from '@components/shared/LoadingSpinner'
import StatusBadge from '@components/shared/StatusBadge'
import { DataTable } from '@components/ui/data-table'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@components/ui'
import { useToast } from '@hooks/use-toast'
import { Order, OrderStatus } from '@types'
import { formatCurrency } from '@lib/utils'

// Admin-only status options — includes Cancelled for manual override capability
// Real backend produces: Pending → Processing → Delivered (COMPLETED)
const STATUS_OPTIONS: OrderStatus[] = [
    'Pending',
    'Processing',
    'Delivered',
    'Cancelled',
]

const AdminOrders: React.FC = () => {
    const { toast } = useToast()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')

    const params = { page, pageSize: 8, search: search || undefined }
    const { data: response, isLoading, isError, refetch } = useAdminOrders(params)
    const { mutate: updateStatus } = useAdminUpdateOrderStatus()

    const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
        updateStatus(
            { orderId, status: newStatus },
            {
                onSuccess: () => {
                    toast({
                        title: 'Order Status Updated',
                        description: `Order ${orderId} has been updated to ${newStatus}.`,
                    })
                    refetch()
                },
                onError: (err) => {
                    toast({
                        title: 'Update failed',
                        description: err.message,
                        variant: 'destructive',
                    })
                },
            }
        )
    }

    const columns = [
        {
            accessorKey: 'id',
            header: 'Order ID',
            sortable: true,
            cell: (order: Order) => <span className="font-bold font-mono text-xs">{order.id}</span>,
        },
        {
            accessorKey: 'createdAt',
            header: 'Date Placed',
            sortable: true,
            cell: (order: Order) => (
                <span className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            accessorKey: 'userId',
            header: 'Customer',
            cell: (order: Order) => (
                <div>
                    <p className="font-bold text-xs">User #1</p>
                    <p className="text-[10px] text-muted-foreground font-mono">ID: {order.userId}</p>
                </div>
            ),
        },
        {
            accessorKey: 'totalAmount',
            header: 'Total Amount',
            sortable: true,
            cell: (order: Order) => (
                <span className="font-bold text-xs text-primary">{formatCurrency(order.totalAmount)}</span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Fulfillment State',
            cell: (order: Order) => (
                <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                </div>
            ),
        },
        {
            accessorKey: 'changeStatus',
            header: 'Actions (Cognito / EventBridge Sim)',
            cell: (order: Order) => (
                <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                    className="h-8 rounded border border-input bg-background px-2 text-xs font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                            {st}
                        </option>
                    ))}
                </select>
            ),
        },
    ]

    return (
        <div className="container py-6 max-w-7xl space-y-6">
            <PageHeader
                title="Customer Orders Ingest"
                description="Monitor purchase streams, triggers downstream Lambda processes and adjust fulfillment states manually"
            />

            {isLoading ? (
                <div className="min-h-[40vh] flex-center">
                    <LoadingSpinner label="Retrieving order ledger..." />
                </div>
            ) : isError ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-4">Error fetching customer orders.</p>
                    <Button onClick={() => refetch()} size="sm">Retry</Button>
                </div>
            ) : (
                <Card className="border border-border/40 shadow-sm">
                    <CardContent className="pt-6">
                        <DataTable
                            columns={columns}
                            data={response?.data || []}
                            searchKey="id"
                            searchPlaceholder="Search by Order ID..."
                            filterOptions={{
                                key: 'status',
                                label: 'Status',
                                options: STATUS_OPTIONS.map((st) => ({ label: st, value: st })),
                            }}
                            pageSize={8}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default AdminOrders
