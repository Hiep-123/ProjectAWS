import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '@components/shared/Header'
import Footer from '@components/shared/Footer'

/**
 * Public Layout
 * Used for public pages (home, products, etc.)
 */
const PublicLayout: React.FC = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}

export default PublicLayout
