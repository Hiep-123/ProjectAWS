import React from 'react'
import { useAdminAnalytics } from '@hooks/queries/useAdmin'
import PageHeader from '@components/shared/PageHeader'
import LoadingSpinner from '@components/shared/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle, Button, Separator } from '@components/ui'
import {
    RevenueChart,
    OrderTrendChart,
    CustomerGrowthChart,
    TopProductsChart,
} from '@components/charts'
import { TrendingUp, Award, TrendingDown, DollarSign } from 'lucide-react'
import { formatCurrency } from '@lib/utils'

const AdminAnalytics: React.FC = () => {
    const { data: analyticsData, isLoading, isError, refetch } = useAdminAnalytics()

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex-center">
                <LoadingSpinner size="lg" label="Retrieving system-wide analytics..." />
            </div>
        )
    }

    if (isError || !analyticsData) {
        return (
            <div className="text-center py-16 space-y-4">
                <p className="text-muted-foreground">Error loading analytics.</p>
                <Button onClick={() => refetch()} size="sm">Retry</Button>
            </div>
        )
    }

    // Format data for child charts
    const revenueData = analyticsData.map((d) => ({
        date: d.date,
        totalRevenue: d.totalRevenue,
    }))

    const orderData = analyticsData.map((d) => ({
        date: d.date,
        totalOrders: d.totalOrders,
    }))

    const customerData = analyticsData.map((d) => ({
        date: d.date,
        totalCustomers: d.totalCustomers,
    }))

    // Calculate aggregated metrics
    const totals = analyticsData.reduce(
        (sum, item) => ({
            revenue: sum.revenue + item.totalRevenue,
            orders: sum.orders + item.totalOrders,
            conversion: sum.conversion + item.conversionRate,
            aov: sum.aov + item.averageOrderValue,
        }),
        { revenue: 0, orders: 0, conversion: 0, aov: 0 }
    )

    const avgConversion = totals.conversion / analyticsData.length
    const avgAov = totals.aov / analyticsData.length

    return (
        <div className="container py-6 max-w-7xl space-y-6">
            <PageHeader
                title="Business Analytics Hub"
                description="Aggregated performance indices across sales channels, transaction volumes, conversion ratios and customer cohorts"
            />

            {/* Performance Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border border-border/40 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Aggregate Period Sales</span>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <h3 className="text-2xl font-black tracking-tight">{formatCurrency(totals.revenue)}</h3>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-1">Cumulated from all sales channels</p>
                    </CardContent>
                </Card>

                <Card className="border border-border/40 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Average Conversion Ratio</span>
                        <Award className="w-4 h-4 text-primary animate-pulse" />
                    </CardHeader>
                    <CardContent>
                        <h3 className="text-2xl font-black tracking-tight">{avgConversion.toFixed(2)}%</h3>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-1">Average user-to-buyer session funnel</p>
                    </CardContent>
                </Card>

                <Card className="border border-border/40 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Mean Order Ticket Value</span>
                        <DollarSign className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <h3 className="text-2xl font-black tracking-tight">{formatCurrency(avgAov)}</h3>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-1">Gross receipt value per completed checkout</p>
                    </CardContent>
                </Card>
            </div>

            {/* Visual Analytics Chart Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RevenueChart data={revenueData} />
                <OrderTrendChart data={orderData} />
                <CustomerGrowthChart data={customerData} />
                <TopProductsChart />
            </div>
        </div>
    )
}

export default AdminAnalytics

