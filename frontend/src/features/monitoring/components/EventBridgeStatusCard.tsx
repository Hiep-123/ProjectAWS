import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui'
import { Zap, CheckCircle2 } from 'lucide-react'

export const EventBridgeStatusCard: React.FC = () => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    EventBridge Status
                </CardTitle>
                <Zap className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span className="text-2xl font-bold">Active</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    All event buses are operating normally.
                </p>
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Matched Events</span>
                        <span className="font-medium">12.4K</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Failed Invocations</span>
                        <span className="font-medium text-destructive">0</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default EventBridgeStatusCard
