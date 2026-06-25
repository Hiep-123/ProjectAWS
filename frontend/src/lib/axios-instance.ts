/**
 * Axios Instance
 *
 * Centralised HTTP client for all API Gateway calls.
 *
 * Request interceptor  — attaches the Cognito ID token as a Bearer header.
 * Response interceptor — on 401, silently refreshes the session via the
 *                        Cognito SDK (not a REST endpoint) then retries
 *                        the original request once.  If the refresh itself
 *                        fails (expired refresh token, signed-out session)
 *                        the user is redirected to /login.
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios'
import { API_CONFIG, LOCAL_STORAGE_KEYS } from './constants'
import { userPool } from '@config/cognito'
import type { ApiError } from '@types'

// ─── Singleton Axios instance ─────────────────────────────────────────────────
export const api: AxiosInstance = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor — attach latest ID token ────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error),
)

// ─── Silent token refresh via Cognito SDK ────────────────────────────────────
/**
 * Uses the Cognito SDK to obtain a fresh ID token using the stored refresh
 * token.  Unlike calling a REST endpoint, this works entirely through the
 * Cognito SDK and does not require a backend /auth/refresh route.
 *
 * Returns the new idToken string, or null if no active session exists.
 */
function refreshCognitoToken(): Promise<string | null> {
    return new Promise((resolve) => {
        const currentUser = userPool.getCurrentUser()
        if (!currentUser) {
            resolve(null)
            return
        }

        currentUser.getSession((err: Error | null, session: any) => {
            if (err || !session?.isValid()) {
                resolve(null)
                return
            }

            const freshToken: string = session.getIdToken().getJwtToken()
            localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, freshToken)
            resolve(freshToken)
        })
    })
}

// ─── Response interceptor — handle 401 with silent refresh ───────────────────
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as typeof error.config & { _retry?: boolean }

        // On 401, attempt one silent refresh then retry.
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true

            const newToken = await refreshCognitoToken()

            if (newToken) {
                originalRequest.headers?.set?.(
                    'Authorization',
                    `Bearer ${newToken}`,
                )

                return api(originalRequest)
            }
            // Refresh failed — clear session and redirect to login.
            localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)
            localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)
            window.location.href = '/login'
        }

        if (error.response?.status === 403) {
            console.warn('[API] 403 Forbidden — insufficient permissions')
        }

        if (error.response?.status === 429) {
            console.warn('[API] 429 Too Many Requests — rate limit hit')
        }

        if (error.response?.status === 500) {
            console.error('[API] 500 Internal Server Error')
        }

        return Promise.reject(error)
    },
)

// ─── Error formatter ──────────────────────────────────────────────────────────
export const handleApiError = (error: unknown): ApiError => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as Record<string, unknown> | undefined
        return {
            code: error.response?.status?.toString() ?? 'UNKNOWN_ERROR',
            message: (data?.['message'] as string) ?? error.message ?? 'An error occurred',
            details: data,
            timestamp: new Date().toISOString(),
        }
    }

    if (error instanceof Error) {
        return { code: 'ERROR', message: error.message, timestamp: new Date().toISOString() }
    }

    return { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred', timestamp: new Date().toISOString() }
}

export default api
