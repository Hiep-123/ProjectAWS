import React from 'react'
import { Routes, Route } from 'react-router-dom'

// Route Guards
import ProtectedRoute from './ProtectedRoute'
import GuestRoute from './GuestRoute'

// Layouts
import PublicLayout from '@layouts/PublicLayout'
import AuthLayout from '@layouts/AuthLayout'

// Public Pages
import Home from '@pages/public/Home'
import Products from '@pages/public/Products'
import ProductDetail from '@pages/public/ProductDetail'
import Cart from '@pages/public/Cart'
import Checkout from '@pages/public/Checkout'
import Orders from '@pages/public/Orders'
import OrderDetail from '@pages/public/OrderDetail'
import Profile from '@pages/public/Profile'
import Recommendations from '@pages/public/Recommendations'

// Auth Pages
import Login from '@pages/auth/Login'
import Register from '@pages/auth/Register'
import ForgotPassword from '@pages/auth/ForgotPassword'
import ConfirmRegistration from '@pages/auth/ConfirmRegistration'
// Error Pages
import NotFound from '@pages/errors/NotFound'
import Unauthorized from '@pages/errors/Unauthorized'
import Forbidden from '@pages/errors/Forbidden'
import ServerError from '@pages/errors/ServerError'

/**
 * Main Routes Component
 */
const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<ProtectedRoute element={<Checkout />} />} />
                <Route path="/orders" element={<ProtectedRoute element={<Orders />} />} />
                <Route path="/orders/:id" element={<ProtectedRoute element={<OrderDetail />} />} />
                <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
                <Route path="/recommendations" element={<Recommendations />} />
            </Route>

            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<GuestRoute element={<Login />} />} />
                <Route path="/register" element={<GuestRoute element={<Register />} />} />
                <Route path="/forgot-password" element={<GuestRoute element={<ForgotPassword />} />} />
                <Route
                    path="/confirm-registration"
                    element={
                        <GuestRoute
                            element={<ConfirmRegistration />}
                        />
                    }
                />
            </Route>

            {/* Error Pages */}
            <Route path="/401" element={<Unauthorized />} />
            <Route path="/403" element={<Forbidden />} />
            <Route path="/500" element={<ServerError />} />

            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default AppRoutes
