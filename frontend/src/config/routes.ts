/**
 * Centralized application route constants.
 */
export const ROUTES = {
    // Public
    HOME: '/',
    PRODUCTS: '/products',
    PRODUCT_DETAIL: (id: string | number) => `/products/${id}`,
    CART: '/cart',

    // Auth
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    CONFIRM_SIGNUP: '/confirm-registration',
    // Protected (Customer)
    CHECKOUT: '/checkout',
    ORDERS: '/orders',
    ORDER_DETAIL: (id: string | number) => `/orders/${id}`,
    PROFILE: '/profile',
    RECOMMENDATIONS: '/recommendations',

    // Admin
    ADMIN: {
        ROOT: '/admin',
        DASHBOARD: '/admin/dashboard',
        PRODUCTS: '/admin/products',
        ORDERS: '/admin/orders',
        CUSTOMERS: '/admin/customers',
        ANALYTICS: '/admin/analytics',
        MONITORING: '/admin/monitoring',
        SETTINGS: '/admin/settings',
    },

    // Errors
    ERROR_401: '/401',
    ERROR_403: '/403',
    ERROR_500: '/500',
    ERROR_404: '/404',
}
