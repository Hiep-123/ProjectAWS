import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui'
import { Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export const LambdaMetricsCard: React.FC = () => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Lambda Invocations
                </CardTitle>
                <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">45.2K</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 text-emerald-500 mr-1" />
                    <span className="text-emerald-500 font-medium">+12.5%</span> from last hour
                </p>
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Errors</span>
                        <span className="font-medium text-destructive">12</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg Duration</span>
                        <span className="font-medium">230ms</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default LambdaMetricsCard
