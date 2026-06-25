import {
    AuthenticationDetails,
    CognitoUser,
    CognitoUserAttribute,
    CognitoUserSession,
} from 'amazon-cognito-identity-js'

import {
    User,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
} from '@types'

import { LOCAL_STORAGE_KEYS } from '@lib'
import { userPool } from '@config/cognito'

const mapRole = (groups?: string[]): User['role'] => {
    if (groups?.includes('ADMIN')) {
        return 'admin'
    }
    return 'customer'

}

const buildUserFromSession = (
    session: CognitoUserSession,
): User => {
    const payload = session.getIdToken().decodePayload()
    return {
        id: payload['sub'] as string,
        email: payload['email'] as string,
        firstName: (payload['given_name'] as string) || '',
        lastName: (payload['family_name'] as string) || '',
        role: mapRole(payload['cognito:groups'] as string[] | undefined),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
}

export const authService = {
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        return new Promise((resolve, reject) => {
            const cognitoUser = new CognitoUser({
                Username: credentials.email,
                Pool: userPool,
            })
            const authDetails = new AuthenticationDetails({
                Username: credentials.email,
                Password: credentials.password,
            })

            cognitoUser.authenticateUser(authDetails, {
                onSuccess: (session) => {
                    const token = session.getIdToken().getJwtToken()

                    localStorage.setItem(
                        LOCAL_STORAGE_KEYS.AUTH_TOKEN,
                        token
                    )

                    const user = buildUserFromSession(
                        session
                    )

                    localStorage.setItem(
                        LOCAL_STORAGE_KEYS.USER,
                        JSON.stringify(user)
                    )

                    resolve({
                        user,
                        token,
                    })
                },

                onFailure: (err) => {
                    reject(
                        new Error(
                            err.message ||
                            'Authentication failed'
                        )
                    )
                },
            })
        })
    },

    async register(
        data: RegisterRequest
    ): Promise<AuthResponse> {
        return new Promise((resolve, reject) => {
            const attributes: CognitoUserAttribute[] = [
                new CognitoUserAttribute({
                    Name: 'email',
                    Value: data.email,
                }),

                new CognitoUserAttribute({
                    Name: 'given_name',
                    Value: data.firstName,
                }),

                new CognitoUserAttribute({
                    Name: 'family_name',
                    Value: data.lastName,
                }),
            ]

            userPool.signUp(
                data.email,
                data.password,
                attributes,
                [],
                (err, result) => {
                    if (err) {
                        reject(
                            new Error(
                                err.message ||
                                'Registration failed'
                            )
                        )
                        return
                    }

                    resolve({
                        user: {
                            id: result?.userSub || '',
                            email: data.email,
                            firstName: data.firstName,
                            lastName: data.lastName,
                            role: 'customer',
                            status: 'active',
                            createdAt:
                                new Date().toISOString(),
                            updatedAt:
                                new Date().toISOString(),
                        },
                        token: '',
                    })
                }
            )
        })
    },

    async confirmRegistration(
        email: string,
        code: string
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const cognitoUser = new CognitoUser({
                Username: email,
                Pool: userPool,
            })

            cognitoUser.confirmRegistration(
                code,
                true,
                (err) => {
                    if (err) {
                        reject(
                            new Error(
                                err.message ||
                                'Verification failed'
                            )
                        )
                        return
                    }

                    resolve()
                }
            )
        })
    },

    async logout(): Promise<void> {
        const currentUser = userPool.getCurrentUser()

        if (currentUser) {
            currentUser.signOut()
        }

        localStorage.removeItem(
            LOCAL_STORAGE_KEYS.AUTH_TOKEN
        )

        localStorage.removeItem(
            LOCAL_STORAGE_KEYS.REFRESH_TOKEN
        )

        localStorage.removeItem(
            LOCAL_STORAGE_KEYS.USER
        )
    },

    async getCurrentUser(): Promise<User | null> {
        const currentUser = userPool.getCurrentUser()

        if (!currentUser) {
            return null
        }

        return new Promise((resolve) => {
            currentUser.getSession(
                (err: Error | null, session: CognitoUserSession | null) => {
                    if (err || !session) {
                        resolve(null)
                        return
                    }

                    resolve(
                        buildUserFromSession(
                            session
                        )
                    )
                }
            )
        })
    },

    async forgotPassword(
        data: ForgotPasswordRequest
    ): Promise<{ message: string }> {
        return new Promise((resolve, reject) => {
            const cognitoUser = new CognitoUser({
                Username: data.email,
                Pool: userPool,
            })

            cognitoUser.forgotPassword({
                onSuccess: () =>
                    resolve({
                        message:
                            'Verification code sent',
                    }),

                onFailure: (err) =>
                    reject(
                        new Error(
                            err.message ||
                            'Forgot password failed'
                        )
                    ),
            })
        })
    },
    async resendConfirmationCode(email: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const cognitoUser = new CognitoUser({
                Username: email,
                Pool: userPool,
            })

            cognitoUser.resendConfirmationCode((err) => {
                if (err) {
                    reject(new Error(err.message || 'Failed to resend code'))
                    return
                }
                resolve()
            })
        })
    },

    async confirmForgotPassword(
        email: string,
        code: string,
        password: string
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const cognitoUser = new CognitoUser({
                Username: email,
                Pool: userPool,
            })

            cognitoUser.confirmPassword(
                code,
                password,
                {
                    onSuccess: () => {
                        resolve()
                    },

                    onFailure: (err) => {
                        reject(
                            new Error(
                                err.message ||
                                'Password reset failed'
                            )
                        )
                    },
                }
            )
        })
    },
    async resetPassword(
        data: ResetPasswordRequest
    ): Promise<AuthResponse> {
        await this.confirmForgotPassword(
            localStorage.getItem(
                'reset_password_email'
            ) || '',
            data.code,
            data.password
        )

        return {
            user: {} as User,
            token: '',
        }
    },

    async refreshToken(): Promise<{
        token: string
    }> {
        const currentUser =
            userPool.getCurrentUser()

        if (!currentUser) {
            throw new Error(
                'No active session'
            )
        }

        return new Promise(
            (resolve, reject) => {
                currentUser.getSession(
                    (err: Error | null, session: CognitoUserSession | null) => {
                        if (
                            err ||
                            !session
                        ) {
                            reject(err)
                            return
                        }

                        const token =
                            session
                                .getIdToken()
                                .getJwtToken()

                        localStorage.setItem(
                            LOCAL_STORAGE_KEYS.AUTH_TOKEN,
                            token
                        )

                        resolve({
                            token,
                        })
                    }
                )
            }
        )
    },
}
