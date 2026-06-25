import { User } from '@types'

const TOKEN_KEY = 'ecommerce_auth_token'
const USER_KEY = 'ecommerce_auth_user'

/**
 * Session Management Utility
 * Handles persistence of authentication state using localStorage.
 * Prepared for future AWS Cognito integration.
 */
export const session = {
    /**
     * Persist authentication token
     */
    setToken: (token: string): void => {
        try {
            localStorage.setItem(TOKEN_KEY, token)
        } catch (error) {
            console.error('Error saving token to session', error)
        }
    },

    /**
     * Retrieve authentication token
     */
    getToken: (): string | null => {
        try {
            return localStorage.getItem(TOKEN_KEY)
        } catch (error) {
            console.error('Error retrieving token from session', error)
            return null
        }
    },

    /**
     * Persist user data
     */
    setUser: (user: User): void => {
        try {
            localStorage.setItem(USER_KEY, JSON.stringify(user))
        } catch (error) {
            console.error('Error saving user to session', error)
        }
    },

    /**
     * Retrieve user data
     */
    getUser: (): User | null => {
        try {
            const userData = localStorage.getItem(USER_KEY)
            return userData ? JSON.parse(userData) : null
        } catch (error) {
            console.error('Error retrieving user from session', error)
            return null
        }
    },

    /**
     * Restore complete session state
     */
    restore: (): { user: User | null; token: string | null } => {
        return {
            user: session.getUser(),
            token: session.getToken(),
        }
    },

    /**
     * Clean up session data on logout
     */
    clear: (): void => {
        try {
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
            // Future Cognito cleanup can be added here
        } catch (error) {
            console.error('Error clearing session', error)
        }
    },
}
