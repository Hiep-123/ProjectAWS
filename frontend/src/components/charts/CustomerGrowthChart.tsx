import React from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui'

interface CustomerGrowthChartProps {
    data: { date: string; totalCustomers: number }[]
    title?: string
    description?: string
}

const CustomerGrowthChart: React.FC<CustomerGrowthChartProps> = ({
    data,
    title = 'Customer Growth',
    description = 'Total registered customers acquisition trend',
}) => {
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border rounded-lg p-3 shadow-md">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                        {payload[0].payload.date}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                        Total Customers: <span className="text-primary">{payload[0].value}</span>
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
                    <LineChart
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
                        <Line
                            type="monotone"
                            dataKey="totalCustomers"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            dot={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

export default CustomerGrowthChart
