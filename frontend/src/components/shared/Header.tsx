import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, Menu, X, LogOut, User, Sun, Moon } from 'lucide-react'
import { Button } from '@components/ui'
import { useCart } from '@contexts/CartContext'
import { useAuth } from '@contexts/AuthContext'
import { useTheme } from '@contexts/ThemeContext'
import { Input } from '@components/ui'

/**
 * Header Component
 * Top navigation bar for public pages
 */
const Header: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const { itemCount } = useCart()
    const { isAuthenticated, logout, user } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const search = formData.get('search')
        if (search) {
            navigate(`/products?search=${encodeURIComponent(search as string)}`)
            setSearchOpen(false)
        }
    }

    return (
        <header className="border-b border-border bg-card sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 font-bold text-lg">
                        <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center rounded font-bold">
                            #
                        </div>
                        <span className="hidden sm:inline">ECommerce</span>
                    </Link>

                    {/* Search - Desktop */}
                    <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xs mx-8">
                        <div className="flex-1 relative">
                            <Input
                                type="text"
                                name="search"
                                placeholder="Search products..."
                                className="w-full"
                            />
                            <Button type="submit" size="icon" variant="ghost" className="absolute right-0">
                                <Search className="w-5 h-5" />
                            </Button>
                        </div>
                    </form>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Theme Toggle */}
                        <Button
                            onClick={toggleTheme}
                            variant="ghost"
                            size="icon"
                            className="hidden sm:flex"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </Button>

                        {/* Search - Mobile */}
                        {searchOpen && (
                            <form onSubmit={handleSearchSubmit} className="md:hidden absolute right-16 top-16 bg-card">
                                <Input
                                    type="text"
                                    name="search"
                                    placeholder="Search..."
                                    className="w-48"
                                    autoFocus
                                />
                            </form>
                        )}
                        <Button
                            onClick={() => setSearchOpen(!searchOpen)}
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                        >
                            <Search className="w-5 h-5" />
                        </Button>

                        {/* Cart */}
                        <Link to="/cart">
                            <Button variant="ghost" size="icon" className="relative">
                                <ShoppingCart className="w-5 h-5" />
                                {itemCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {itemCount}
                                    </span>
                                )}
                            </Button>
                        </Link>

                        {/* Auth */}
                        {isAuthenticated ? (
                            <div className="hidden sm:flex items-center gap-2">
                                <Link to="/profile">
                                    <Button variant="ghost" size="sm">
                                        <User className="w-4 h-4" />
                                        {user?.firstName}
                                    </Button>
                                </Link>
                                <Button onClick={handleLogout} variant="ghost" size="icon">
                                    <LogOut className="w-5 h-5" />
                                </Button>
                            </div>
                        ) : (
                            <div className="hidden sm:flex gap-2">
                                <Link to="/login">
                                    <Button variant="ghost" size="sm">
                                        Login
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button size="sm">Register</Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 hover:bg-muted rounded-md"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-border py-4 space-y-2">
                        {isAuthenticated ? (
                            <>
                                <Link to="/profile" className="block px-4 py-2 hover:bg-muted rounded">
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 hover:bg-muted rounded"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="block px-4 py-2 hover:bg-muted rounded">
                                    Login
                                </Link>
                                <Link to="/register" className="block px-4 py-2 hover:bg-muted rounded">
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
