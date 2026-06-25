import React from 'react'
import { CheckCircle2, Clock, Package, Mail, Truck, Zap, Activity } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui'

interface TimelineEvent {
    id: string
    status: string
    title: string
    description: string
    timestamp: string
    icon: React.ReactNode
    service: string
}

const timelineData: TimelineEvent[] = [
    {
        id: '1',
        status: 'completed',
        title: 'Order Placed',
        description: 'Order received via API Gateway.',
        timestamp: '10:00 AM',
        icon: <Package className="w-5 h-5" />,
        service: 'Order Service',
    },
    {
        id: '2',
        status: 'completed',
        title: 'Processing Started',
        description: 'Order event published to EventBridge.',
        timestamp: '10:01 AM',
        icon: <Zap className="w-5 h-5" />,
        service: 'EventBridge',
    },
    {
        id: '3',
        status: 'completed',
        title: 'Inventory Updated',
        description: 'Inventory deducted via SQS Queue & Lambda Consumer.',
        timestamp: '10:02 AM',
        icon: <Activity className="w-5 h-5" />,
        service: 'SQS -> Lambda',
    },
    {
        id: '4',
        status: 'current',
        title: 'Email Sent',
        description: 'Confirmation email dispatched via SES.',
        timestamp: '10:05 AM',
        icon: <Mail className="w-5 h-5" />,
        service: 'Lambda -> SES',
    },
    {
        id: '5',
        status: 'pending',
        title: 'Shipped',
        description: 'Awaiting fulfillment from warehouse partner.',
        timestamp: '--',
        icon: <Truck className="w-5 h-5" />,
        service: 'Fulfillment API',
    },
    {
        id: '6',
        status: 'pending',
        title: 'Delivered',
        description: 'Final delivery confirmation.',
        timestamp: '--',
        icon: <CheckCircle2 className="w-5 h-5" />,
        service: 'Webhook',
    },
]

export const OrderTimeline: React.FC = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    AWS Event-Driven Flow
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative border-l-2 border-muted ml-3 space-y-8 pb-4">
                    {timelineData.map((event, index) => {
                        const isCompleted = event.status === 'completed'
                        const isCurrent = event.status === 'current'
                        
                        return (
                            <div key={event.id} className="relative pl-8">
                                <div
                                    className={`absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-background
                                    ${isCompleted ? 'border-primary text-primary' : ''}
                                    ${isCurrent ? 'border-accent text-accent animate-pulse' : ''}
                                    ${!isCompleted && !isCurrent ? 'border-muted-foreground text-muted-foreground' : ''}`}
                                >
                                    {event.icon}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                    <div>
                                        <h4 className={`text-sm font-semibold ${!isCompleted && !isCurrent ? 'text-muted-foreground' : ''}`}>
                                            {event.title}
                                        </h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {event.description}
                                        </p>
                                        <div className="mt-2 inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                                            {event.service}
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap font-medium bg-muted px-2 py-1 rounded">
                                        {event.timestamp}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

export default OrderTimeline
