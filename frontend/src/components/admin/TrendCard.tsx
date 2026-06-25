import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface TrendCardProps {
    title: string
    currentValue: string | number
    previousValue: string | number
    percentageChange: number
    timeframe: string
}

export const TrendCard: React.FC<TrendCardProps> = ({ 
    title, 
    currentValue, 
    previousValue, 
    percentageChange, 
    timeframe 
}) => {
    const isPositive = percentageChange > 0
    const isNeutral = percentageChange === 0

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-3xl font-bold">{currentValue}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            vs {previousValue} last {timeframe}
                        </p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 
                          isNeutral ? 'bg-muted text-muted-foreground' : 
                          'bg-destructive/10 text-destructive'}`}
                    >
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : 
                         isNeutral ? <Minus className="w-3 h-3" /> : 
                         <TrendingDown className="w-3 h-3" />}
                        {Math.abs(percentageChange)}%
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default TrendCard
