import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    ShoppingCart,
    Search,
    Menu,
    X,
    LogOut,
    User,
    Sun,
    Moon,
} from 'lucide-react'
import { Button } from '@components/ui'
import { useCart } from '@contexts/CartContext'
import { useAuth } from '@contexts/AuthContext'
import { useTheme } from '@contexts/ThemeContext'

/**
 * Main header for the storefront, including search, cart, and auth actions.
 */
const Header: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
    const { itemCount } = useCart()
    const { isAuthenticated, logout, user } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    /** Navigate to /products?search=<term> on form submit */
    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const q = (fd.get('search') as string).trim()
        if (q) {
            navigate(`/products?search=${encodeURIComponent(q)}`)
            setMobileSearchOpen(false)
            setMobileMenuOpen(false)
        }
    }

    return (
        <header className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4">

                {/* ── Main row: logo | search | actions ── */}
                <div className="flex items-center justify-between h-16 gap-4">

                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-2 font-bold text-lg shrink-0"
                    >
                        <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center rounded font-bold text-sm">
                            #
                        </div>
                        <span className="hidden sm:inline">ECommerce</span>
                    </Link>

                    {/* ── Desktop search bar ─────────────────────────────────
                         Sits between logo and actions in the SAME flex row.
                         The icon is absolutely positioned inside the wrapper —
                         it never flows below or outside the input.
                    ────────────────────────────────────────────────────── */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="hidden md:block flex-1 max-w-[420px]"
                    >
                        {/* Wrapper — position:relative so the icon anchors to it */}
                        <div className="relative">
                            <input
                                type="text"
                                name="search"
                                placeholder="Search products..."
                                className={[
                                    'w-full h-11 rounded-lg border border-input bg-background',
                                    'pl-4 pr-11',               // pr-11 keeps text away from icon
                                    'text-sm text-foreground placeholder:text-muted-foreground',
                                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                                    'transition-colors',
                                ].join(' ')}
                            />
                            {/* Icon: absolute, vertically centred with top-1/2 + -translate-y-1/2 */}
                            <button
                                type="submit"
                                aria-label="Search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                    {/* ── Right actions ─────────────────────────────────── */}
                    <div className="flex items-center gap-1 shrink-0">

                        {/* Theme toggle */}
                        <Button
                            onClick={toggleTheme}
                            variant="ghost"
                            size="icon"
                            className="hidden sm:flex"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark'
                                ? <Sun className="w-5 h-5" />
                                : <Moon className="w-5 h-5" />}
                        </Button>

                        {/* Mobile search toggle */}
                        <Button
                            onClick={() => setMobileSearchOpen(v => !v)}
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            aria-label="Toggle search"
                        >
                            <Search className="w-5 h-5" />
                        </Button>

                        {/* Cart */}
                        <Link to="/cart">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative"
                                aria-label="Cart"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                {itemCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                                        {itemCount}
                                    </span>
                                )}
                            </Button>
                        </Link>

                        {/* Auth (desktop) */}
                        {isAuthenticated ? (
                            <div className="hidden sm:flex items-center gap-1">
                                <Link to="/orders">
                                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-semibold">
                                        My Orders
                                    </Button>
                                </Link>
                                <Link to="/profile">
                                    <Button variant="ghost" size="sm" className="gap-1.5">
                                        <User className="w-4 h-4" />
                                        {user?.firstName}
                                    </Button>
                                </Link>
                                <Button
                                    onClick={handleLogout}
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </Button>
                            </div>
                        ) : (
                            <div className="hidden sm:flex gap-1">
                                <Link to="/login">
                                    <Button variant="ghost" size="sm">Login</Button>
                                </Link>
                                <Link to="/register">
                                    <Button size="sm">Register</Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(v => !v)}
                            className="md:hidden p-2 hover:bg-muted rounded-md"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen
                                ? <X className="w-5 h-5" />
                                : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* ── Mobile search bar ──────────────────────────────────── */}
                {mobileSearchOpen && (
                    <div className="md:hidden pb-3">
                        <form onSubmit={handleSearchSubmit}>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="search"
                                    placeholder="Search products..."
                                    autoFocus
                                    className={[
                                        'w-full h-11 rounded-lg border border-input bg-background',
                                        'pl-4 pr-11',
                                        'text-sm text-foreground placeholder:text-muted-foreground',
                                        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                                    ].join(' ')}
                                />
                                <button
                                    type="submit"
                                    aria-label="Search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── Mobile nav menu ────────────────────────────────────── */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-border py-3 space-y-1">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/orders"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-2 hover:bg-muted rounded-md text-sm font-semibold"
                                >
                                    My Orders
                                </Link>
                                <Link
                                    to="/profile"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-2 hover:bg-muted rounded-md text-sm font-medium"
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={() => { setMobileMenuOpen(false); handleLogout() }}
                                    className="w-full text-left px-4 py-2 hover:bg-muted rounded-md text-sm font-medium"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-2 hover:bg-muted rounded-md text-sm font-medium"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-2 hover:bg-muted rounded-md text-sm font-medium"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                )}

            </div>
        </header>
    )
}

export default Header
