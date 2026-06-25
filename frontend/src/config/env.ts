/// <reference types="vite/client" />

/**
 * Environment Variables Configuration
 * Centralizes access to Vite environment variables.
 */

interface ImportMetaEnv {
    readonly VITE_API_URL: string;

    // AWS Cognito
    readonly VITE_COGNITO_USER_POOL_ID: string;
    readonly VITE_COGNITO_CLIENT_ID: string;
    readonly VITE_COGNITO_REGION: string;

    // Environment
    readonly VITE_ENVIRONMENT: string;

    // Feature Flags
    readonly VITE_ENABLE_MOCKS: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
/**
 * Environment Variables Configuration
 * Centralizes access to Vite environment variables.
 */

export const ENV = {
    API_URL:
        import.meta.env['VITE_API_URL'] ||
        'https://api.example.com/v1',

    COGNITO_USER_POOL_ID:
        import.meta.env['VITE_COGNITO_USER_POOL_ID'] || '',

    COGNITO_CLIENT_ID:
        import.meta.env['VITE_COGNITO_CLIENT_ID'] || '',

    COGNITO_REGION:
        import.meta.env['VITE_COGNITO_REGION'] || 'us-east-1',

    ENVIRONMENT:
        import.meta.env['VITE_ENVIRONMENT'] || 'development',

    IS_PRODUCTION:
        import.meta.env['VITE_ENVIRONMENT'] === 'production',

    IS_DEVELOPMENT:
        import.meta.env['VITE_ENVIRONMENT'] === 'development',

    ENABLE_MOCKS:
        import.meta.env['VITE_ENABLE_MOCKS'] !== 'false',
} as const;