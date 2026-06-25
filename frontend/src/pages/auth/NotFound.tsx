import React from 'react'
import { Card, CardContent, Button } from '@components/ui'
import { AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const NotFound: React.FC = () => {
    const navigate = useNavigate()
    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
            <Card className="max-w-md w-full">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="text-6xl font-bold text-primary">404</div>
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
                    <h2 className="text-2xl font-bold">Page Not Found</h2>
                    <p className="text-muted-foreground">The page you're looking for doesn't exist</p>
                    <Button onClick={() => navigate('/')} className="w-full">
                        Back to Home
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export default NotFound
