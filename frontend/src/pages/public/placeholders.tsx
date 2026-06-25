import React from 'react'
import { Card, CardContent } from '@components/ui'
import { AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * Placeholder page component shown for features that are not yet implemented.
 * Each exported component is a proper React function component so that
 * React hooks rules are satisfied.
 */
const PlaceholderPage: React.FC = () => {
    const navigate = useNavigate()

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <Card className="max-w-md w-full">
                <CardContent className="pt-6 text-center space-y-4">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
                    <h2 className="text-2xl font-bold">Coming Soon</h2>
                    <p className="text-muted-foreground">This feature is coming soon</p>
                    <button
                        onClick={() => navigate('/')}
                        className="text-primary hover:underline"
                    >
                        ← Back to Home
                    </button>
                </CardContent>
            </Card>
        </div>
    )
}

export const Cart = PlaceholderPage
export const Checkout = PlaceholderPage
export const Orders = PlaceholderPage
export const OrderDetail = PlaceholderPage
export const Profile = PlaceholderPage
export const Recommendations = PlaceholderPage
