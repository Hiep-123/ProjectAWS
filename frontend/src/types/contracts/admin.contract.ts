export interface DashboardMetricsResponse {
    totalRevenue: number
    revenueGrowth: number
    activeOrders: number
    ordersGrowth: number
    totalCustomers: number
    customersGrowth: number
    systemHealth: number
}

export interface RevenueDataPoint {
    date: string
    revenue: number
    orders: number
}

export interface GetRevenueChartResponse {
    data: RevenueDataPoint[]
}

export interface RecentActivity {
    id: string
    type: 'order' | 'user' | 'system'
    message: string
    timestamp: string
}

export interface GetRecentActivityResponse {
    activities: RecentActivity[]
}
