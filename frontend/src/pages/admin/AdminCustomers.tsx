import React, { useState } from 'react'
import { useAdminCustomers } from '@hooks/queries/useAdmin'
import PageHeader from '@components/shared/PageHeader'
import LoadingSpinner from '@components/shared/LoadingSpinner'
import { DataTable } from '@components/ui/data-table'
import { Card, CardContent, Badge, Avatar, AvatarImage, AvatarFallback, Button } from '@components/ui'
import { User } from '@types'

const AdminCustomers: React.FC = () => {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')

    const params = { page, pageSize: 8, search: search || undefined }
    const { data: response, isLoading, isError, refetch } = useAdminCustomers(params)

    const columns = [
        {
            accessorKey: 'avatar',
            header: 'Profile',
            cell: (c: User) => (
                <Avatar className="h-8 w-8">
                    {c.avatar ? (
                        <AvatarImage src={c.avatar} alt={`${c.firstName} ${c.lastName}`} />
                    ) : (
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                            {c.firstName[0]}
                            {c.lastName[0]}
                        </AvatarFallback>
                    )}
                </Avatar>
            ),
        },
        {
            accessorKey: 'firstName',
            header: 'Full Name',
            sortable: true,
            cell: (c: User) => (
                <span className="font-bold text-xs">
                    {c.firstName} {c.lastName}
                </span>
            ),
        },
        {
            accessorKey: 'email',
            header: 'Email Address',
            sortable: true,
            cell: (c: User) => <span className="text-xs font-mono">{c.email}</span>,
        },
        {
            accessorKey: 'phone',
            header: 'Phone Number',
            cell: (c: User) => <span className="text-xs text-muted-foreground">{c.phone || 'N/A'}</span>,
        },
        {
            accessorKey: 'createdAt',
            header: 'Date Registered',
            cell: (c: User) => (
                <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Identity Status',
            cell: (c: User) => {
                const color =
                    c.status === 'active'
                        ? 'bg-green-500/10 text-green-600 border-green-500/20'
                        : c.status === 'suspended'
                        ? 'bg-red-500/10 text-red-600 border-red-500/20 animate-pulse'
                        : 'bg-muted text-muted-foreground border-muted-foreground/20'
                return (
                    <Badge variant="outline" className={`capitalize text-[10px] font-bold ${color}`}>
                        {c.status}
                    </Badge>
                )
            },
        },
    ]

    return (
        <div className="container py-6 max-w-7xl space-y-6">
            <PageHeader
                title="Cognito User Directory"
                description="Monitor customer accounts, inspect MFA flags and lock or suspend profiles in the user database pool"
            />

            {isLoading ? (
                <div className="min-h-[40vh] flex-center">
                    <LoadingSpinner label="Retrieving Cognito pool ledger..." />
                </div>
            ) : isError ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-4">Error fetching Cognito directories.</p>
                    <Button onClick={() => refetch()} size="sm">Retry</Button>
                </div>
            ) : (
                <Card className="border border-border/40 shadow-sm">
                    <CardContent className="pt-6">
                        <DataTable
                            columns={columns}
                            data={response?.data || []}
                            searchKey="firstName"
                            searchPlaceholder="Search Cognito directory by name..."
                            filterOptions={{
                                key: 'status',
                                label: 'Status',
                                options: [
                                    { label: 'Active', value: 'active' },
                                    { label: 'Suspended', value: 'suspended' },
                                    { label: 'Inactive', value: 'inactive' },
                                ],
                            }}
                            pageSize={8}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default AdminCustomers
