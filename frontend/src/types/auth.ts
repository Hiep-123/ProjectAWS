export type UserRole =
    | 'customer'
    | 'admin'

export interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
}

export interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole

    phone?: string
    avatar?: string

    status:
    | 'active'
    | 'inactive'
    | 'suspended'

    createdAt: string
    updatedAt: string
}