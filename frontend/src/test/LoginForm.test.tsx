import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '@pages/auth/Login'

// Hoist-safe module mock — must be at top level
vi.mock('@contexts', () => ({
    useAuth: () => ({
        login: vi.fn().mockResolvedValue(undefined),
        error: null,
        isLoading: false,
        isAuthenticating: false,
        isAuthenticated: false,
        user: null,
    }),
}))

// useToast is called inside Login; provide a no-op stub
vi.mock('@hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}))

const renderLogin = () =>
    render(
        <MemoryRouter>
            <Login />
        </MemoryRouter>
    )

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders email and password fields', () => {
        renderLogin()
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    })

    it('renders the Sign In submit button', () => {
        renderLogin()
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('renders a link to the register page', () => {
        renderLogin()
        // Login.tsx: "Register here"
        expect(screen.getByRole('link', { name: /register here/i })).toBeInTheDocument()
    })

    it('renders a link to the forgot-password page', () => {
        renderLogin()
        // Login.tsx: "Forgot password?"
        expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
    })
})
