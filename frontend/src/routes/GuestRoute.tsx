import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@contexts'

interface GuestRouteProps {
    element: React.ReactElement
}

/**
 * GuestRoute
 * Prevents logged-in users from accessing routes meant for guests 
 * (e.g., login, register, forgot-password).
 * If authenticated, redirects to the home page or the page they came from.
 */
const GuestRoute: React.FC<GuestRouteProps> = ({ element }) => {
    const { isAuthenticated, isLoading } = useAuth()
    const location = useLocation()
    const from = location.state?.from?.pathname || '/'

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (isAuthenticated) {
        return <Navigate to={from} replace />
    }

    return element
}

export default GuestRoute
