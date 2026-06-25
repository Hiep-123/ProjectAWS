import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@contexts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input } from '@components/ui'
import { useToast } from '@hooks/use-toast'
import { Mail, Lock, UserPlus, ShieldAlert, User } from 'lucide-react'

const Register: React.FC = () => {
    const navigate = useNavigate()
    const { register: signup, error, isAuthenticating } = useAuth()
    const { toast } = useToast()

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            toast({
                title: 'Password Mismatch',
                description: 'Passwords do not match.',
                variant: 'destructive',
            })
            return
        }

        try {
            await signup(
                email,
                firstName,
                lastName,
                password
            )

            toast({
                title: 'Verify Email',
                description:
                    'Please check your inbox for the verification code.',
            })

            navigate('/confirm-registration', { state: { email } })
        } catch (err: any) {
            toast({
                title: 'Registration Failed',
                description: err.message || 'Check your details and try again.',
                variant: 'destructive',
            })
        }
    }

    return (
        <Card className="border border-border/40 shadow-xl max-w-md w-full bg-card/70 backdrop-blur-md">
            <CardHeader className="space-y-2 text-center pb-6">
                <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit text-primary mb-2">
                    <UserPlus className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">Create Account</CardTitle>
                <CardDescription className="text-xs font-medium">
                    Register a new customer profile on Amazon Cognito IDP
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="firstName" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">First Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="firstName"
                                    type="text"
                                    placeholder="John"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="pl-9 h-11 text-xs"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="lastName" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Last Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="lastName"
                                    type="text"
                                    placeholder="Doe"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="pl-9 h-11 text-xs"
                                    required
                                />
                            </div>
                        </div>
                    </div>

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

                    <div className="space-y-1.5">
                        <label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-9 h-11 text-xs"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="confirmPassword" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-9 h-11 text-xs"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-11 font-semibold text-sm mt-2 shadow-md" isLoading={isAuthenticating}>
                        Register Account
                    </Button>
                </form>

                <div className="text-center text-xs font-semibold text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:underline font-bold">
                        Login here
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}

export default Register
