/**
 * AdminRoute tests
 *
 * vi.mock is hoisted to the top of the module by Vitest.
 * A mutable authState object lets each test control the mock return value
 * without re-importing or using vi.doMock (which is not hoisted).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminRoute from '@routes/AdminRoute'

// Mutable auth state controlled per-test
const authState = {
    isAuthenticated: false,
    isLoading: false,
    user: null as { role: string } | null,
}

vi.mock('@contexts', () => ({
    useAuth: () => ({ ...authState }),
}))

const AdminPage = () => <div>Admin Dashboard</div>

const renderRoute = () =>
    render(
        <MemoryRouter>
            <AdminRoute element={<AdminPage />} />
        </MemoryRouter>
    )

describe('AdminRoute', () => {
    beforeEach(() => {
        authState.isAuthenticated = false
        authState.isLoading = false
        authState.user = null
    })

    it('shows spinner (no content) while loading', () => {
        authState.isLoading = true
        renderRoute()
        expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument()
    })

    it('redirects to /login when user is unauthenticated', () => {
        authState.isAuthenticated = false
        renderRoute()
        expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument()
    })

    it('redirects to /403 when user is authenticated but not admin', () => {
        authState.isAuthenticated = true
        authState.user = { role: 'customer' }
        renderRoute()
        expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument()
    })

    it('renders admin content when user has ADMIN role', () => {
        authState.isAuthenticated = true
        authState.user = { role: 'admin' }
        renderRoute()
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })
})
