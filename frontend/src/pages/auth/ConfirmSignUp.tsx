import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui'
import { Button } from '@components/ui'
import { Input } from '@components/ui'
import { CheckCircle } from 'lucide-react'
import { authService } from '@services'
import { useToast } from '@hooks/use-toast'

const ConfirmSignUp: React.FC = () => {
    const navigate = useNavigate()
    const { toast } = useToast()

    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setLoading(true)

            await authService.confirmRegistration(
                email,
                code
            )

            toast({
                title: 'Account Verified',
                description: 'You can now login.',
            })

            navigate('/login')
        } catch (error: any) {
            toast({
                title: 'Verification Failed',
                description: error.message,
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="max-w-md w-full">
            <CardHeader>
                <CardTitle>Email Verification</CardTitle>
                <CardDescription>
                    Enter the verification code sent by Cognito.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <Input
                        placeholder="Email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                    />

                    <Input
                        placeholder="Verification Code"
                        value={code}
                        onChange={(e) =>
                            setCode(e.target.value)
                        }
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        isLoading={loading}
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verify Account
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export default ConfirmSignUp