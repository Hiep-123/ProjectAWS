import { ENV } from './env'

/**
 * Centralized API endpoint configurations.
 */
export const API_ENDPOINTS = {
    // Auth endpoints
    AUTH: {
        LOGIN: `${ENV.API_URL}/auth/login`,
        REGISTER: `${ENV.API_URL}/auth/register`,
        LOGOUT: `${ENV.API_URL}/auth/logout`,
        FORGOT_PASSWORD: `${ENV.API_URL}/auth/forgot-password`,
        ME: `${ENV.API_URL}/auth/me`,
    },

    // Products endpoints
    PRODUCTS: {
        LIST: `${ENV.API_URL}/products`,
        DETAIL: (id: string) => `${ENV.API_URL}/products/${id}`,
        RECOMMENDATIONS: (id: string) => `${ENV.API_URL}/products/${id}/recommendations`,
    },

    // Orders endpoints
    ORDERS: {
        LIST: `${ENV.API_URL}/orders`,
        DETAIL: (id: string) => `${ENV.API_URL}/orders/${id}`,
        CREATE: `${ENV.API_URL}/orders`,
        TIMELINE: (id: string) => `${ENV.API_URL}/orders/${id}/timeline`,
    },

    // Admin endpoints
    ADMIN: {
        DASHBOARD: `${ENV.API_URL}/admin/dashboard`,
        MONITORING: `${ENV.API_URL}/admin/monitoring`,
        USERS: `${ENV.API_URL}/admin/users`,
    },
}
