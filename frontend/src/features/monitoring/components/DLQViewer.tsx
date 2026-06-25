import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@components/ui'
import { AlertCircle, RotateCcw } from 'lucide-react'

interface DLQMessage {
    id: string
    queueName: string
    errorMessage: string
    timestamp: string
    retryCount: number
}

const mockMessages: DLQMessage[] = [
    {
        id: 'msg-001',
        queueName: 'OrderProcessingDLQ',
        errorMessage: 'DynamoDB ProvisionedThroughputExceededException',
        timestamp: '2 mins ago',
        retryCount: 3,
    },
    {
        id: 'msg-002',
        queueName: 'InventoryUpdateDLQ',
        errorMessage: 'Timeout waiting for external warehouse API',
        timestamp: '15 mins ago',
        retryCount: 5,
    },
]

export const DLQViewer: React.FC = () => {
    return (
        <Card className="border-destructive/50">
            <CardHeader className="bg-destructive/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-5 h-5" />
                    Dead Letter Queues (DLQ)
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {mockMessages.map((msg) => (
                        <div key={msg.id} className="flex flex-col sm:flex-row justify-between p-4 border rounded-lg gap-4">
                            <div>
                                <h4 className="font-semibold text-sm">{msg.queueName}</h4>
                                <p className="text-sm text-destructive mt-1">{msg.errorMessage}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>{msg.timestamp}</span>
                                    <span>Retries: {msg.retryCount}</span>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="shrink-0 flex items-center gap-2 self-start">
                                <RotateCcw className="w-4 h-4" />
                                Redrive
                            </Button>
                        </div>
                    ))}
                    {mockMessages.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            No messages in DLQ. System is healthy.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default DLQViewer
