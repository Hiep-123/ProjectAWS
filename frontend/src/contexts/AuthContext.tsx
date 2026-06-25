import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from 'react'

import { User, AuthState } from '@types'
import { authService } from '@services'
import { LOCAL_STORAGE_KEYS } from '@lib'

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>
    register: (email: string, firstName: string, lastName: string, password: string) => Promise<void>
    confirmRegistration: (email: string, code: string) => Promise<void>
    resendConfirmationCode: (email: string) => Promise<void>
    logout: () => Promise<void>
    forgotPassword: (email: string) => Promise<void>
    resetPassword: (email: string, code: string, password: string) => Promise<void>
    updateProfile?: (data: Partial<User>) => Promise<void>
    isAuthenticating: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticating, setIsAuthenticating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ─── Session initialisation ───────────────────────────────────────────────
    // On mount, ask Cognito SDK for the current session.  getSession() will
    // transparently use the refresh token to obtain a fresh ID token when the
    // stored one has expired, so we never boot with a stale JWT.
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Try to get a fresh token from the Cognito session first.
                const refreshed = await authService.refreshToken().catch(() => null)

                if (refreshed?.token) {
                    setToken(refreshed.token)
                    const currentUser = await authService.getCurrentUser()
                    setUser(currentUser)
                } else {
                    // Fall back to whatever is in localStorage (covers the case
                    // where the Cognito session is still valid on first load).
                    const storedToken = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)
                    if (storedToken) {
                        setToken(storedToken)
                        const currentUser = await authService.getCurrentUser()
                        setUser(currentUser)
                    }
                }
            } catch (err) {
                console.error('Error initialising auth:', err)
                localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)
                localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()
    }, [])

    // ─── Actions ──────────────────────────────────────────────────────────────

    const login = useCallback(async (email: string, password: string) => {
        try {
            setIsAuthenticating(true)
            setError(null)
            const response = await authService.login({ email, password })
            setUser(response.user)
            setToken(response.token)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed'
            setError(message)
            throw err
        } finally {
            setIsAuthenticating(false)
        }
    }, [])

    const register = useCallback(
        async (email: string, firstName: string, lastName: string, password: string) => {
            try {
                setIsAuthenticating(true)
                setError(null)
                await authService.register({
                    email,
                    firstName,
                    lastName,
                    password,
                    confirmPassword: password,
                    acceptTerms: true,
                })
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Registration failed'
                setError(message)
                throw err
            } finally {
                setIsAuthenticating(false)
            }
        },
        [],
    )

    const confirmRegistration = useCallback(async (email: string, code: string) => {
        try {
            setError(null)
            await authService.confirmRegistration(email, code)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Verification failed'
            setError(message)
            throw err
        }
    }, [])

    const resendConfirmationCode = useCallback(async (email: string) => {
        try {
            setError(null)
            await authService.resendConfirmationCode(email)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to resend code'
            setError(message)
            throw err
        }
    }, [])

    const logout = useCallback(async () => {
        try {
            setIsAuthenticating(true)
            await authService.logout()
            setUser(null)
            setToken(null)
            setError(null)
        } finally {
            setIsAuthenticating(false)
        }
    }, [])

    const forgotPassword = useCallback(async (email: string) => {
        try {
            setError(null)
            await authService.forgotPassword({ email })
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send reset code'
            setError(message)
            throw err
        }
    }, [])

    const resetPassword = useCallback(
        async (email: string, code: string, password: string) => {
            try {
                setError(null)
                await authService.confirmForgotPassword(email, code, password)
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to reset password'
                setError(message)
                throw err
            }
        },
        [],
    )

    const updateProfile = async (data: Partial<User>) => {
        if (!user) return
        const updated = { ...user, ...data }
        setUser(updated)
        localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(updated))
    }

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        error,
        login,
        register,
        confirmRegistration,
        resendConfirmationCode,
        logout,
        forgotPassword,
        resetPassword,
        updateProfile,
        isAuthenticating,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
