import React from 'react'
import { Outlet, Link } from 'react-router-dom'

/**
 * Auth Layout
 * Used for authentication pages (login, register, etc.)
 */
const AuthLayout: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <Link to="/" className="flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center rounded font-bold">
                            #
                        </div>
                        <span className="font-bold text-lg">ECommerce</span>
                    </Link>
                    <Outlet />
                </div>
            </div>
            <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
                <p>&copy; 2024 E-Commerce Platform. All rights reserved.</p>
            </footer>
        </div>
    )
}

export default AuthLayout
