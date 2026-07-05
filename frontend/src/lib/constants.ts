/**
 * Application Constants
 * Centralized configuration for the E-Commerce Platform
 */

export const APP_NAME = 'NexaStore'
export const APP_VERSION = '1.0.0'
export const APP_DESCRIPTION = 'Production-ready E-Commerce Platform powered by AWS Serverless'

// API Configuration
// Priority: 1. window.__RUNTIME_API_URL__ (injected at deploy from /config.json)
//           2. VITE_API_URL (set at build time via .env for local dev)
//           3. '' — surfaces as a network error, never silently calls wrong endpoint
export const API_BASE_URL: string =
    window.__RUNTIME_API_URL__ ||
    import.meta.env['VITE_API_URL'] ||
    ''
export const API_TIMEOUT = 30000

export const API_CONFIG = {
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
}

export const TAX_RATE = 0.08

export const QUERY_KEYS = {
    PRODUCTS: ['products'],
    PRODUCT: (id: string) => ['product', id],
    ORDERS: ['orders'],
    ORDER: (id: string) => ['order', id],
    CUSTOMERS: ['customers'],
    ANALYTICS: ['analytics'],
    MONITORING: ['monitoring'],
}

// Local Storage Keys
export const LOCAL_STORAGE_KEYS = {
    AUTH_TOKEN: 'nexastore_auth_token',
    REFRESH_TOKEN: 'nexastore_refresh_token',
    USER: 'nexastore_user',
    CART: 'nexastore_cart',
    THEME: 'nexastore_theme',
    RECENT_SEARCHES: 'nexastore_recent_searches',
} as const

// Pagination
export const DEFAULT_PAGE_SIZE = 12
export const ADMIN_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Order Status Flow — matches real backend demo flow: PENDING → PROCESSING → COMPLETED
// Frontend display: Pending → Processing → Delivered
export const ORDER_STATUSES = [
    { key: 'pending', label: 'Pending', description: 'Order received and queued for processing', icon: 'Clock' },
    { key: 'processing', label: 'Processing', description: 'Order event dispatched via EventBridge → SQS → Lambda', icon: 'Cog' },
    { key: 'delivered', label: 'Delivered', description: 'Order fulfilled and delivered to customer', icon: 'CheckCircle' },
] as const

export const ORDER_STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    delivered: 'Delivered',
    // Legacy / backward compat — Cancelled can appear in old mock data
    cancelled: 'Cancelled',
}

// Product Categories — must match DynamoDB seed data categories exactly.
// These values are used by both Home page and Products page filter.
// Changing a value here requires reseeding DynamoDB if categories change.
export const PRODUCT_CATEGORIES = [
    { value: 'all', label: 'All', icon: '🛍️' },
    { value: 'laptops', label: 'Laptops', icon: '💻' },
    { value: 'phones', label: 'Phones', icon: '📱' },
    { value: 'audio', label: 'Audio', icon: '🎧' },
    { value: 'accessories', label: 'Accessories', icon: '⌨️' },
    { value: 'gaming', label: 'Gaming', icon: '🎮' },
] as const

// Sort Options — values must match backend Lambda sort param handling
export const SORT_OPTIONS = [
    { value: 'default', label: 'Default' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'name_asc', label: 'Name: A to Z' },
] as const

// Price Ranges
export const PRICE_RANGES = [
    { value: 'all', label: 'All Prices', min: 0, max: Infinity },
    { value: '0-50', label: 'Under $50', min: 0, max: 50 },
    { value: '50-100', label: '$50 – $100', min: 50, max: 100 },
    { value: '100-250', label: '$100 – $250', min: 100, max: 250 },
    { value: '250-500', label: '$250 – $500', min: 250, max: 500 },
    { value: '500+', label: 'Over $500', min: 500, max: Infinity },
] as const

// Delivery Methods
export const DELIVERY_METHODS = [
    { id: 'standard', name: 'Standard Shipping', description: '5–7 business days', price: 5.99 },
    { id: 'express', name: 'Express Shipping', description: '2–3 business days', price: 14.99 },
    { id: 'overnight', name: 'Overnight Shipping', description: 'Next business day', price: 29.99 },
    { id: 'free', name: 'Free Shipping', description: '7–10 business days', price: 0 },
] as const

// Payment Methods
export const PAYMENT_METHODS = [
    { id: 'card', label: 'Credit / Debit Card', icon: 'CreditCard' },
    { id: 'paypal', label: 'PayPal', icon: 'DollarSign' },
    { id: 'amazon_pay', label: 'Amazon Pay', icon: 'ShoppingBag' },
] as const

// AWS Service Labels (for monitoring page)
export const AWS_SERVICES = {
    EVENT_BRIDGE: 'Amazon EventBridge',
    SQS: 'Amazon SQS',
    SNS: 'Amazon SNS',
    LAMBDA: 'AWS Lambda',
    DYNAMO: 'Amazon DynamoDB',
    COGNITO: 'Amazon Cognito',
    API_GATEWAY: 'Amazon API Gateway',
    CLOUD_WATCH: 'Amazon CloudWatch',
} as const

// Mock delay for simulating API calls (ms)
export const MOCK_DELAY = {
    SHORT: 300,
    MEDIUM: 600,
    LONG: 1200,
} as const

// Coupon codes for demo
export const DEMO_COUPONS: Record<string, number> = {
    SAVE10: 10,
    NEXASTORE20: 20,
    AWS2024: 15,
    WELCOME50: 50,
}

// Chart Colors
export const CHART_COLORS = {
    primary: '#FF9900',
    secondary: '#232F3E',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    purple: '#8b5cf6',
    teal: '#14b8a6',
} as const

export const CHART_PALETTE = [
    '#FF9900', '#232F3E', '#22c55e', '#3b82f6',
    '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6',
]
