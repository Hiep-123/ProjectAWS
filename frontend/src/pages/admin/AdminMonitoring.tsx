import React from 'react'
import {
    useAdminMonitoringMetrics,
    useAdminSystemHealth,
    useAdminFailedMessages,
    useAdminEventBridgeEvents,
    useAdminRetryMessage
} from '@hooks/queries/useAdmin'
import PageHeader from '@components/shared/PageHeader'
import LoadingSpinner from '@components/shared/LoadingSpinner'
import { MonitoringCharts } from '@components/charts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button } from '@components/ui'
import { AlertCircle, CheckCircle, Clock, AlertTriangle, RefreshCw, Send } from 'lucide-react'
import { useToast } from '@hooks/use-toast'

const AdminMonitoring: React.FC = () => {
    const { toast } = useToast()

    // Query hooks
    const { data: metrics, isLoading: loadingMetrics } = useAdminMonitoringMetrics()
    const { data: health, isLoading: loadingHealth } = useAdminSystemHealth()
    const { data: failedMessages, isLoading: loadingFailed } = useAdminFailedMessages()
    const { data: events, isLoading: loadingEvents } = useAdminEventBridgeEvents(6)

    // Mutation
    const { mutate: retryMessage } = useAdminRetryMessage()

    const handleRetry = (msgId: string) => {
        retryMessage(msgId, {
            onSuccess: (res) => {
                toast({
                    title: 'Message Queued',
                    description: res.message || 'Retry event dispatched.',
                })
            },
            onError: (err) => {
                toast({
                    title: 'Retry failed',
                    description: err.message,
                    variant: 'destructive',
                })
            },
        })
    }

    if (loadingMetrics || loadingHealth || loadingFailed || loadingEvents) {
        return (
            <div className="min-h-[60vh] flex-center">
                <LoadingSpinner size="lg" label="Establishing connection to AWS CloudWatch..." />
            </div>
        )
    }

    return (
        <div className="space-y-6 container max-w-7xl py-6">
            <PageHeader
                title="AWS CloudWatch Monitor"
                description="Simulated AWS CloudWatch logs tracking EventBridge transactions, SQS queues and Lambda dead-letter queues"
            />

            {/* System Health */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { service: 'EventBridge Bus', status: health?.eventBridge },
                    { service: 'Inventory SQS', status: health?.inventoryQueue },
                    { service: 'Email SQS Service', status: health?.emailQueue },
                    { service: 'Lambda Processors', status: health?.lambda },
                ].map((item) => {
                    const isHealthy = item.status === 'healthy'
                    const labelColor = isHealthy
                        ? 'bg-green-500/10 text-green-600 border-green-500/20'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse'
                    return (
                        <Card key={item.service} className="border border-border/40">
                            <CardContent className="pt-6 flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{item.service}</p>
                                    <h3 className="text-sm font-bold capitalize">{item.status || 'unknown'}</h3>
                                </div>
                                <Badge variant="outline" className={`capitalize text-[10px] font-bold ${labelColor}`}>
                                    {item.status}
                                </Badge>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Current CloudWatch Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Lambda Executions', value: metrics?.lambdaExecutions || '0' },
                    { label: 'Lambda Failures', value: metrics?.lambdaErrors || '0', error: (metrics?.lambdaErrors || 0) > 0 },
                    { label: 'DLQ message count', value: metrics?.dlqMessages || '0', error: (metrics?.dlqMessages || 0) > 0 },
                    { label: 'AWS Event Processing', value: `${metrics?.eventProcessingTime || 0}ms` },
                ].map((metric) => (
                    <Card key={metric.label} className="border border-border/40">
                        <CardContent className="pt-6">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{metric.label}</p>
                            <p className={`text-2xl font-black mt-2 tracking-tight ${metric.error ? 'text-red-500' : 'text-foreground'}`}>
                                {metric.value}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Chart visualizations component */}
            <MonitoringCharts />

            {/* Failed Messages Table */}
            <Card className="border border-border/40 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                        Lambda Dead Letter Queue (DLQ)
                    </CardTitle>
                    <CardDescription>
                        Failed asynchronous payloads requiring manual retry operations or schema corrections
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {failedMessages && failedMessages.length > 0 ? (
                        failedMessages.map((msg) => (
                            <div key={msg.id} className="p-4 border border-border/60 rounded-xl space-y-2 bg-card text-xs font-semibold">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-extrabold text-foreground text-sm">{msg.eventType}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">MESSAGE ID: {msg.id}</p>
                                    </div>
                                    <Badge variant="destructive" className="text-[10px] font-bold">
                                        DLQ Blocked
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground font-medium text-xs leading-normal py-1 border-y border-dashed my-2">
                                    Failure Reason: <span className="text-destructive font-semibold">{msg.reason}</span>
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground font-medium">Retry Attempts: <span className="text-foreground font-extrabold">{msg.retries}</span></span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRetry(msg.id)}
                                        className="h-8 text-xs font-semibold gap-1"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Re-Drive Message
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center py-6 text-xs text-muted-foreground font-semibold">DLQ is empty. No failed messages.</p>
                    )}
                </CardContent>
            </Card>

            {/* Event Log timeline */}
            <Card className="border border-border/40 shadow-sm">
                <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                    <div className="p-1.5 rounded bg-primary/10 text-primary">
                        <Send className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-lg font-bold">EventBridge Event Log</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {events?.map((evt) => {
                        const succeeded = evt.status === 'succeeded'
                        return (
                            <div key={evt.id} className="flex items-center gap-4 p-3 bg-muted/20 border border-border/40 rounded-xl text-xs font-semibold">
                                <div className="shrink-0">
                                    {succeeded ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-extrabold text-foreground">{evt.eventType}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">Source: {evt.source}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-muted-foreground text-[10px]">{new Date(evt.timestamp).toLocaleTimeString()}</p>
                                    <Badge variant={succeeded ? 'default' : 'destructive'} className="text-[9px] font-bold mt-1">
                                        {evt.status}
                                    </Badge>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}

export default AdminMonitoring
