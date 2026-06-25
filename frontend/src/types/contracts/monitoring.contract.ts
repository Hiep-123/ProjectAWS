import { MonitoringMetrics } from '../api'

export interface GetSystemHealthResponse {
    status: 'healthy' | 'degraded' | 'down'
    metrics: MonitoringMetrics
    lastUpdated: string
}

export interface DLQMessage {
    messageId: string
    receiptHandle: string
    body: any
    attributes: Record<string, string>
    receivedTimestamp: number
}

export interface GetDLQMessagesResponse {
    queueUrl: string
    messages: DLQMessage[]
    totalMessages: number
}

export interface RetryDLQMessageRequest {
    messageId: string
    receiptHandle: string
}

export interface RetryDLQMessageResponse {
    success: boolean
    message: string
}

export interface GetLambdaMetricsRequest {
    functionName: string
    periodInMinutes?: number
}

export interface LambdaMetricDataPoint {
    timestamp: string
    invocations: number
    errors: number
    duration: number
    throttles: number
}

export interface GetLambdaMetricsResponse {
    functionName: string
    metrics: LambdaMetricDataPoint[]
}

export interface GetEventBridgeStatusResponse {
    busName: string
    status: 'active' | 'inactive'
    failedInvocations: number
    matchedEvents: number
}
