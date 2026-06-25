import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui'
import { RotateCcw, ArrowDownRight } from 'lucide-react'

export const RetryMetricsCard: React.FC = () => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    System Retries
                </CardTitle>
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">142</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <ArrowDownRight className="w-3 h-3 text-emerald-500 mr-1" />
                    <span className="text-emerald-500 font-medium">-5.2%</span> from last hour
                </p>
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Successful</span>
                        <span className="font-medium text-emerald-500">138</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Exhausted (to DLQ)</span>
                        <span className="font-medium text-destructive">4</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default RetryMetricsCard
