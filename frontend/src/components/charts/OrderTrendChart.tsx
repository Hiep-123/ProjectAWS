import React from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui'

interface OrderTrendChartProps {
    data: { date: string; totalOrders: number }[]
    title?: string
    description?: string
}

const OrderTrendChart: React.FC<OrderTrendChartProps> = ({
    data,
    title = 'Order Volume Trends',
    description = 'Daily completed order volume counts',
}) => {
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border rounded-lg p-3 shadow-md">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                        {payload[0].payload.date}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                        Orders: <span className="text-primary">{payload[0].value}</span>
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <Card className="col-span-4 border border-border/40">
            <CardHeader>
                <CardTitle className="text-xl font-bold">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] pl-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 10,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                        <XAxis
                            dataKey="date"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="totalOrders"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

export default OrderTrendChart
