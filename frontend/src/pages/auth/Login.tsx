import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@contexts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Separator } from '@components/ui'
import { useToast } from '@hooks/use-toast'
import { Mail, Lock, ShieldAlert, Eye, EyeOff } from 'lucide-react'

const Login: React.FC = () => {
    const navigate = useNavigate()
    const { login, error, isAuthenticating } = useAuth()
    const { toast } = useToast()

    const [email, setEmail] = React.useState('john@example.com')
    const [password, setPassword] = React.useState('password')
    const [showPassword, setShowPassword] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await login(email, password)
            toast({
                title: 'Signed In',
                description: 'Welcome back to your workspace.',
            })
            navigate('/')
        } catch (err: any) {
            toast({
                title: 'Sign In Failed',
                description: err.message || 'Check your credentials and try again.',
                variant: 'destructive',
            })
        }
    }

    return (
        <Card className="border border-border/40 shadow-xl max-w-md w-full bg-card/70 backdrop-blur-md">
            <CardHeader className="space-y-2 text-center pb-6">
                <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit text-primary mb-2">
                    <Lock className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">Access Your Account</CardTitle>
                <CardDescription className="text-xs font-medium">
                    Secure login authenticated via Amazon Cognito IDP
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold">
                        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-9 h-11"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                            <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-9 pr-10 h-11"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-11 font-semibold text-sm mt-2 shadow-md" isLoading={isAuthenticating}>
                        Sign In
                    </Button>
                </form>

                <div className="text-center text-xs font-semibold text-muted-foreground">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary hover:underline font-bold">
                        Register here
                    </Link>
                </div>

                <Separator />
            </CardContent>
        </Card>
    )
}

export default Login
