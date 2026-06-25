import React from 'react'
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui'

interface CategoryData {
    name: string
    value: number
}

interface TopProductsChartProps {
    data?: CategoryData[]
    title?: string
    description?: string
}

const COLORS = [
    'hsl(var(--primary))',
    '#2563eb', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
]

const defaultCategoryData: CategoryData[] = [
    { name: 'Electronics', value: 45 },
    { name: 'Clothing', value: 25 },
    { name: 'Home & Kitchen', value: 15 },
    { name: 'Books', value: 10 },
    { name: 'Beauty', value: 5 },
]

const TopProductsChart: React.FC<TopProductsChartProps> = ({
    data = defaultCategoryData,
    title = 'Sales by Category',
    description = 'Percentage distribution of sales by category',
}) => {
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border rounded-lg p-3 shadow-md">
                    <p className="text-sm font-bold text-foreground">
                        {payload[0].name}: <span className="text-primary">{payload[0].value}%</span>
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
            <CardContent className="h-[350px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(value) => <span className="text-xs text-muted-foreground font-medium">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

export default TopProductsChart
