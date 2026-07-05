import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@contexts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input } from '@components/ui'
import { useToast } from '@hooks/use-toast'
import { Mail, ShieldAlert, ArrowLeft, KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react'

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate()
    const { forgotPassword, resetPassword, error, isAuthenticating } = useAuth()
    const { toast } = useToast()

    const [email, setEmail] = useState('')
    const [step, setStep] = useState<'request' | 'confirm'>('request')
    const [code, setCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [showNewPassword, setShowNewPassword] = useState(false)

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await forgotPassword(email)
            localStorage.setItem(
                'reset_password_email',
                email
            )
            toast({
                title: 'Reset Code Sent',
                description: 'Check your email inbox for the Cognito verification code.',
            })
            setStep('confirm')
        } catch (err: any) {
            toast({
                title: 'Request Failed',
                description: err.message || 'Check your email and try again.',
                variant: 'destructive',
            })
        }
    }

    const handleConfirmReset = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await resetPassword(
                email,
                code,
                newPassword
            )
            toast({
                title: 'Password Reset Success',
                description: 'Your Cognito password credentials have been updated. Please sign in.',
            })
            navigate('/login')
        } catch (err: any) {
            toast({
                title: 'Reset Failed',
                description: err.message || 'Invalid verification code or weak password.',
                variant: 'destructive',
            })
        }
    }

    return (
        <Card className="border border-border/40 shadow-xl max-w-md w-full bg-card/70 backdrop-blur-md">
            <CardHeader className="space-y-2 text-center pb-6">
                <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit text-primary mb-2">
                    <KeyRound className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">
                    {step === 'request' ? 'Reset Password' : 'Confirm Reset'}
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                    {step === 'request'
                        ? 'Request an OTP verification code via Cognito IDP'
                        : 'Confirm the OTP sent to your email to configure a new password'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold">
                        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {step === 'request' ? (
                    <form onSubmit={handleRequestCode} className="space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9 h-11 text-xs"
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-11 font-semibold text-sm mt-2 shadow-md" isLoading={isAuthenticating}>
                            Send Verification Code
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleConfirmReset} className="space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor="code" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">OTP Verification Code</label>
                            <div className="relative">
                                <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="code"
                                    type="text"
                                    placeholder="e.g. 123456"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="pl-9 h-11 text-xs"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="newPassword" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New Password</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="pl-9 pr-10 h-11 text-xs"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(v => !v)}
                                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-11 font-semibold text-sm mt-2 shadow-md" isLoading={isAuthenticating}>
                            Confirm New Password
                        </Button>
                    </form>
                )}

                <div className="text-center text-xs font-semibold">
                    <Link to="/login" className="text-muted-foreground hover:text-foreground font-bold inline-flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Login
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}

export default ForgotPassword
