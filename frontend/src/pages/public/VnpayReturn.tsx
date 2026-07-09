import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { Button, Card, CardContent } from '@components/ui'
import { formatCurrency } from '@lib/utils'
import { api } from '@lib'

const VnpayReturn: React.FC = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')

    const responseCode = searchParams.get('vnp_ResponseCode')
    const orderId = searchParams.get('vnp_TxnRef')
    const amountRaw = searchParams.get('vnp_Amount')
    const exchangeRate = 25000
    const amount = amountRaw ? (Number(amountRaw) / 100) / exchangeRate : 0

    useEffect(() => {
        const verify = async () => {
            const params: Record<string, string> = {}
            searchParams.forEach((value, key) => {
                params[key] = value
            })

            try {
                await api.post('/payments/vnpay-verify', params)
                if (responseCode === '00') {
                    setStatus('success')
                } else {
                    setStatus('failed')
                }
            } catch (err) {
                console.error('[VNPayReturn] Verification error:', err)
                setStatus('failed')
            }
        }

        verify()
    }, [searchParams, responseCode])

    const handleViewOrder = () => {
        if (orderId) {
            navigate(`/orders/${orderId}`)
        } else {
            navigate('/orders')
        }
    }

    return (
        <div className="container py-16 flex justify-center items-center min-h-[70vh]">
            <Card className="w-full max-w-md border border-border/40 shadow-xl overflow-hidden backdrop-blur-md bg-card/90">
                <div className="h-2 bg-gradient-to-r from-primary to-purple-600" />
                <CardContent className="pt-8 text-center space-y-6">
                    {status === 'loading' && (
                        <div className="space-y-4">
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                            <h2 className="text-xl font-bold">Verifying Payment...</h2>
                            <p className="text-muted-foreground text-sm">Please wait while we check your transaction status.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-green-600 tracking-tight">Payment Successful!</h2>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                Thank you for your purchase. Your order has been placed and is being processed.
                            </p>

                            {orderId && (
                                <div className="bg-muted/50 p-4 rounded-xl text-left text-xs space-y-2 border border-border/20">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Order ID:</span>
                                        <span className="font-mono font-semibold text-foreground">{orderId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Amount Paid:</span>
                                        <span className="font-bold text-foreground">{formatCurrency(amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Payment Method:</span>
                                        <span className="font-semibold text-foreground">VNPay Gateway</span>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 space-y-2">
                                <Button onClick={handleViewOrder} className="w-full flex items-center justify-center gap-2 h-11 font-semibold">
                                    Track Order Status
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" onClick={() => navigate('/')} className="w-full h-10 text-xs">
                                    Back to Homepage
                                </Button>
                            </div>
                        </div>
                    )}

                    {status === 'failed' && (
                        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <XCircle className="w-12 h-12" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-destructive tracking-tight">Payment Failed</h2>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                The transaction was cancelled or failed to process. No funds were captured.
                            </p>

                            {orderId && (
                                <div className="bg-muted/50 p-4 rounded-xl text-left text-xs space-y-2 border border-border/20">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Order ID:</span>
                                        <span className="font-mono font-semibold text-foreground">{orderId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Error Code:</span>
                                        <span className="font-semibold text-destructive">{responseCode || 'Unknown'}</span>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 space-y-2">
                                <Button onClick={handleViewOrder} className="w-full h-11 font-semibold" variant="outline">
                                    View Order & Retry Payment
                                </Button>
                                <Button onClick={() => navigate('/cart')} className="w-full h-11 font-semibold">
                                    Return to Cart
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default VnpayReturn
