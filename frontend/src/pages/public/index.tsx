import React from 'react'
import { Card, CardContent } from '@components/ui'
import { AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const createPlaceholderPage = (title: string, description: string) => {
    return () => {
        const navigate = useNavigate()
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center space-y-4">
                        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
                        <h2 className="text-2xl font-bold">{title}</h2>
                        <p className="text-muted-foreground">{description}</p>
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
}

export const Products = createPlaceholderPage('Products', 'Product catalog page')
export const ProductDetail = createPlaceholderPage('Product Detail', 'Individual product page')
export const Cart = createPlaceholderPage('Shopping Cart', 'View your shopping cart')
export const Checkout = createPlaceholderPage('Checkout', 'Complete your purchase')
export const Orders = createPlaceholderPage('Orders', 'Your order history')
export const OrderDetail = createPlaceholderPage('Order Detail', 'Order tracking & details')
export const Profile = createPlaceholderPage('Profile', 'Your account settings')
export const Recommendations = createPlaceholderPage('Recommendations', 'AI-powered product suggestions')
export const Register = createPlaceholderPage('Register', 'Create a new account')
export const ForgotPassword = createPlaceholderPage('Forgot Password', 'Reset your password')
export const NotFound = createPlaceholderPage('404', 'Page not found')
