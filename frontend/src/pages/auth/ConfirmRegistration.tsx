import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@contexts'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Button,
    Input,
} from '@components/ui'
import { useToast } from '@hooks/use-toast'
import { CheckCircle, Mail, RefreshCw, ShieldAlert, ArrowLeft } from 'lucide-react'

const RESEND_COOLDOWN_SECONDS = 60

/**
 * ConfirmRegistration
 *
 * Email verification page shown after sign-up.
 * - Accepts the 6-digit Cognito verification code.
 * - Allows resending the code with a 60-second cooldown.
 * - Pre-fills the email from navigation state (passed by Register page).
 * - Maps Cognito error codes to user-friendly messages.
 */
const ConfirmRegistration: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { confirmRegistration, resendConfirmationCode, error, isAuthenticating } = useAuth()
    const { toast } = useToast()

    // Register page passes { email } via location.state
    const initialEmail = (location.state as { email?: string } | null)?.email ?? ''

    const [email, setEmail] = useState(initialEmail)
    const [code, setCode] = useState('')
    const [cooldown, setCooldown] = useState(0)

    // Start cooldown timer
    useEffect(() => {
        if (cooldown <= 0) return
        const id = setInterval(() => setCooldown((s) => s - 1), 1000)
        return () => clearInterval(id)
    }, [cooldown])

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await confirmRegistration(email, code)
            toast({
                title: 'Email Verified',
                description: 'Your account is confirmed. You can now sign in.',
            })
            navigate('/login')
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Verification failed'
            toast({
                title: 'Verification Failed',
                description: mapCognitoError(msg),
                variant: 'destructive',
            })
        }
    }

    const handleResend = useCallback(async () => {
        if (!email) {
            toast({
                title: 'Email Required',
                description: 'Please enter your email address first.',
                variant: 'destructive',
            })
            return
        }
        try {
            await resendConfirmationCode(email)
            setCooldown(RESEND_COOLDOWN_SECONDS)
            toast({
                title: 'Code Resent',
                description: 'A new verification code has been sent to your inbox.',
            })
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to resend code'
            toast({
                title: 'Resend Failed',
                description: msg,
                variant: 'destructive',
            })
        }
    }, [email, resendConfirmationCode, toast])

    return (
        <Card className="border border-border/40 shadow-xl max-w-md w-full bg-card/70 backdrop-blur-md">
            <CardHeader className="space-y-2 text-center pb-6">
                <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit text-primary mb-2">
                    <Mail className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">
                    Verify Your Email
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                    Enter the 6-digit verification code sent to your inbox by Amazon Cognito
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {error && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold">
                        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleConfirm} className="space-y-4">
                    {/* Email — pre-filled from Register, editable in case of mismatch */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="email"
                            className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                        >
                            Email Address
                        </label>
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
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {/* Verification code */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="code"
                            className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                        >
                            Verification Code
                        </label>
                        <div className="relative">
                            <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="code"
                                type="text"
                                placeholder="e.g. 123456"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="pl-9 h-11 text-xs tracking-widest font-mono"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 font-semibold text-sm shadow-md"
                        isLoading={isAuthenticating}
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verify Account
                    </Button>
                </form>

                {/* Resend code */}
                <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">
                        Didn't receive a code?
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold"
                        onClick={handleResend}
                        disabled={cooldown > 0}
                    >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        {cooldown > 0
                            ? `Resend in ${cooldown}s`
                            : 'Resend Code'}
                    </Button>
                </div>

                <div className="text-center text-xs font-semibold">
                    <Link
                        to="/login"
                        className="text-muted-foreground hover:text-foreground font-bold inline-flex items-center gap-1"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Login
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}

/** Maps raw Cognito error messages to user-friendly strings. */
function mapCognitoError(message: string): string {
    if (/CodeMismatchException/i.test(message) || /invalid.*code/i.test(message)) {
        return 'The verification code is incorrect. Please check your email and try again.'
    }
    if (/ExpiredCodeException/i.test(message) || /expired/i.test(message)) {
        return 'The verification code has expired. Please request a new one.'
    }
    if (/UserNotFoundException/i.test(message) || /user.*not.*found/i.test(message)) {
        return 'No account found for this email address.'
    }
    if (/NotAuthorizedException/i.test(message) || /already.*confirmed/i.test(message)) {
        return 'This account is already verified. You can sign in now.'
    }
    if (/LimitExceededException/i.test(message)) {
        return 'Too many attempts. Please wait a moment before trying again.'
    }
    return message
}

export default ConfirmRegistration
