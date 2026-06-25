import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@contexts'

interface AdminRouteProps {
    element: React.ReactElement
}

/**
 * AdminRoute
 * Ensures the user is authenticated and has the ADMIN role.
 * If not authenticated, redirects to /login.
 * If authenticated but not admin, redirects to /403.
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ element }) => {
    const { user, isAuthenticated, isLoading } = useAuth()
    const location = useLocation()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Checking against 'ADMIN' (case-insensitive for robustness)
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN'

    if (!isAdmin) {
        return <Navigate to="/403" replace />
    }

    return element
}

export default AdminRoute
