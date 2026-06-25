import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    BarChart3,
    Monitor,
    Settings,
    Menu,
    X,
} from 'lucide-react'
import { Button } from '@components/ui'
import { useAuth } from '@contexts'

const adminMenuItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Monitoring', href: '/admin/monitoring', icon: Monitor },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
]

/**
 * Admin Layout
 * Responsive admin dashboard layout with sidebar
 */
const AdminLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()
    const { logout } = useAuth()

    const isActive = (href: string) => {
        return location.pathname === href || location.pathname.startsWith(href + '/')
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out z-40 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-6">
                    <Link to="/" className="flex items-center gap-2 font-bold text-lg">
                        <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center rounded">
                            #
                        </div>
                        <span>Admin</span>
                    </Link>
                </div>

                <nav className="space-y-2 px-4">
                    {adminMenuItems.map(item => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${active
                                        ? 'bg-accent text-accent-foreground'
                                        : 'text-muted-foreground hover:bg-muted'
                                    }`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="absolute bottom-6 left-4 right-4">
                    <Button
                        onClick={() => {
                            logout()
                            setSidebarOpen(false)
                        }}
                        variant="outline"
                        className="w-full"
                    >
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="border-b border-border bg-card sticky top-0 z-30">
                    <div className="flex items-center justify-between p-4 lg:px-6">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 hover:bg-muted rounded-md"
                        >
                            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                        <div className="flex-1" />
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon">
                                <Settings className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-auto">
                    <div className="p-4 lg:p-6">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    )
}

export default AdminLayout
