import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    description?: string
    trend?: {
        value: number
        isPositive: boolean
    }
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, description, trend }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(description || trend) && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        {trend && (
                            <span className={trend.isPositive ? 'text-emerald-500' : 'text-destructive'}>
                                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                            </span>
                        )}
                        {description && <span>{description}</span>}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

export default MetricCard
