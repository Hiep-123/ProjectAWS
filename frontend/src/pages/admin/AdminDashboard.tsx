import React from 'react'
import {
    useAdminDashboardMetrics,
    useAdminDashboardCharts,
    useAdminRecentActivities
} from '@hooks/queries/useAdmin'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui'
import { RevenueChart, OrderTrendChart } from '@components/charts'
import { MetricCard } from '@components/admin/MetricCard'
import LoadingSpinner from '@components/shared/LoadingSpinner'
import PageHeader from '@components/shared/PageHeader'
import { DollarSign, ShoppingBag, Users, Layers, Activity } from 'lucide-react'
import { formatCurrency } from '@lib/utils'

const AdminDashboard: React.FC = () => {
    const { data: metrics, isLoading: loadingMetrics } = useAdminDashboardMetrics()
    const { data: charts, isLoading: loadingCharts } = useAdminDashboardCharts()
    const { data: activities, isLoading: loadingActivities } = useAdminRecentActivities(5)

    if (loadingMetrics || loadingCharts || loadingActivities) {
        return (
            <div className="min-h-[60vh] flex-center">
                <LoadingSpinner size="lg" label="Retrieving dashboard intelligence..." />
            </div>
        )
    }

    return (
        <div className="space-y-8 container max-w-7xl py-6">
            <PageHeader
                title="Management Dashboard"
                description="Live operations control panel for business metrics and AWS architecture resource states"
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Total Revenue" 
                    value={formatCurrency(metrics?.revenue || 0)} 
                    icon={DollarSign} 
                    trend={{ value: 12.5, isPositive: true }} 
                />
                <MetricCard 
                    title="Total Orders" 
                    value={metrics?.orders.toLocaleString() || '0'} 
                    icon={ShoppingBag} 
                    trend={{ value: 8.3, isPositive: true }} 
                />
                <MetricCard 
                    title="Total Customers" 
                    value={metrics?.customers.toLocaleString() || '0'} 
                    icon={Users} 
                    trend={{ value: 15.2, isPositive: true }} 
                />
                <MetricCard 
                    title="Avg Order Value" 
                    value={formatCurrency(metrics?.averageOrderValue || 0)} 
                    icon={Layers} 
                    trend={{ value: 1.4, isPositive: false }} 
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
                <div className="lg:col-span-4">
                    <RevenueChart data={charts?.revenueTrend || []} />
                </div>
                <div className="lg:col-span-4">
                    <OrderTrendChart data={charts?.orderTrend || []} />
                </div>
            </div>

            {/* Recent Activities */}
            <Card className="border border-border/40">
                <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                    <div className="p-1.5 rounded bg-primary/10 text-primary">
                        <Activity className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-lg font-bold">Recent System Activity</CardTitle>
                </CardHeader>
                <CardContent className="divide-y">
                    {activities?.map((act) => (
                        <div key={act.id} className="flex justify-between items-center py-4 first:pt-0 last:pb-0 text-xs font-semibold">
                            <div className="space-y-0.5">
                                <p className="text-foreground text-sm font-bold capitalize">{act.type.replace('_', ' ')}</p>
                                <p className="text-muted-foreground font-semibold leading-normal">{act.description}</p>
                            </div>
                            <span className="text-muted-foreground text-[10px]">
                                {new Date(act.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export default AdminDashboard
