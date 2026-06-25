/**
 * User Type Definitions
 * Represents user and authentication data models
 */

export interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
    avatar?: string
    role: 'customer' | 'admin'
    status: 'active' | 'inactive' | 'suspended'
    createdAt: string
    updatedAt: string
}

export interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
}

export interface LoginRequest {
    email: string
    password: string
    rememberMe?: boolean
}

export interface RegisterRequest {
    email: string
    firstName: string
    lastName: string
    password: string
    confirmPassword: string
    acceptTerms: boolean
}

export interface ForgotPasswordRequest {
    email: string
}

export interface ResetPasswordRequest {
    email: string,
    code: string,
    password: string
}

export interface AuthResponse {
    user: User
    token: string
    refreshToken?: string
}

export interface UserProfile extends User {
    addresses: Address[]
    orderCount: number
    totalSpent: number
    preferences?: UserPreferences
}

export interface Address {
    id: string
    name: string
    street: string
    city: string
    state: string
    postalCode: string
    country: string
    phone: string
    isDefault?: boolean
}

export interface UserPreferences {
    emailNotifications: boolean
    pushNotifications: boolean
    newsletter: boolean
    theme: 'light' | 'dark' | 'auto'
    language: string
}

export interface UserResponse {
    data: User[]
    total: number
    page: number
    pageSize: number
}
