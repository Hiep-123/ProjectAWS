import { User } from '../auth'

export interface AuthLoginRequest {
    email: string
    password: string
}

export interface AuthLoginResponse {
    token: string
    user: User
    expiresIn: number
}

export interface AuthRegisterRequest {
    email: string
    firstName: string
    lastName: string
    password: string
}

export interface AuthRegisterResponse {
    message: string
    user: User
}

export interface AuthForgotPasswordRequest {
    email: string
}

export interface AuthForgotPasswordResponse {
    message: string
}
