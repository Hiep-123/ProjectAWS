import React from 'react'
import { useAuth } from '@contexts'

interface PermissionGuardProps {
    role: "CUSTOMER" | "ADMIN"
    children: React.ReactNode
    fallback?: React.ReactNode
}

/**
 * PermissionGuard
 * Conditionally renders children based on the user's role.
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({ role, children, fallback = null }) => {
    const { user, isAuthenticated } = useAuth()

    if (!isAuthenticated || !user) {
        return <>{fallback}</>
    }

    // Checking against the role flexibly since user.role might be lowercase in some mocks
    const userRole = user.role.toUpperCase()
    
    // For admin role, allow super_admin as well if it exists in mock data
    if (role === 'ADMIN' && (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN')) {
        return <>{children}</>
    }

    if (userRole === role) {
        return <>{children}</>
    }

    return <>{fallback}</>
}

export default PermissionGuard
