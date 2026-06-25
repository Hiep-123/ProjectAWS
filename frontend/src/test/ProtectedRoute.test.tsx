/**
 * ProtectedRoute tests
 *
 * vi.mock must be called at the top level so Vitest can hoist it before
 * module imports.  We use a mutable ref object to control the auth state
 * returned by each test case.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProtectedRoute from '@routes/ProtectedRoute'

// Mutable auth state controlled per-test
const authState = {
    isAuthenticated: false,
    isLoading: false,
    user: null as { role: string } | null,
}

vi.mock('@contexts', () => ({
    useAuth: () => ({ ...authState }),
}))

const MockPage = () => <div>Protected Content</div>

const renderRoute = () =>
    render(
        <MemoryRouter initialEntries={['/profile']}>
            <ProtectedRoute element={<MockPage />} />
        </MemoryRouter>
    )

describe('ProtectedRoute', () => {
    beforeEach(() => {
        // Reset to unauthenticated, not loading before each test
        authState.isAuthenticated = false
        authState.isLoading = false
        authState.user = null
    })

    it('shows spinner (no content) while loading', () => {
        authState.isLoading = true
        renderRoute()
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('redirects to /login when not authenticated', () => {
        authState.isAuthenticated = false
        renderRoute()
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('renders children when user is authenticated', () => {
        authState.isAuthenticated = true
        authState.user = { role: 'customer' }
        renderRoute()
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
})
