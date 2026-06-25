import React from 'react'
import { Card, CardContent } from '@components/ui'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    colorClass?: string
}

export const StatCard: React.FC<StatCardProps> = ({ 
    title, 
    value, 
    icon: Icon,
    colorClass = 'text-primary'
}) => {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-full bg-muted ${colorClass}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold mt-1">{value}</h3>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default StatCard
