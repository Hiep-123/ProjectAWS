import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui'
import { Server, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export const QueueHealthCard: React.FC = () => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    SQS Queue Health
                </CardTitle>
                <Server className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">99.98%</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 text-emerald-500 mr-1" />
                    <span className="text-emerald-500 font-medium">+0.01%</span> from last hour
                </p>
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Messages Visible</span>
                        <span className="font-medium">1,204</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">In Flight</span>
                        <span className="font-medium">45</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default QueueHealthCard
