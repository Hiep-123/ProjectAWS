/// <reference types="vite/client" />

/**
 * Environment Variables Configuration — Phase 10 update
 *
 * Resolution priority for each value:
 *   1. window.__RUNTIME_*   — injected from /config.json at deploy time
 *                             (set by FrontendStack CDK BucketDeployment)
 *   2. import.meta.env.*    — VITE_* variables baked in at build time
 *                             (used for local development via frontend/.env)
 *   3. safe empty string '' — surfaces as a visible error rather than
 *                             silently calling a wrong endpoint
 *
 * NEVER add a hardcoded production URL as a fallback — it creates a hidden
 * dependency that survives even after the real infrastructure is updated.
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

export const ENV = {
    // ── API URL ───────────────────────────────────────────────────────────────
    // Priority: runtime config.json → VITE_API_URL → '' (fails loudly)
    API_URL:
        window.__RUNTIME_API_URL__ ||
        import.meta.env['VITE_API_URL'] ||
        '',

    // ── Cognito ───────────────────────────────────────────────────────────────
    // Priority for each field: runtime config.json → VITE_* → ''
    COGNITO_USER_POOL_ID:
        window.__RUNTIME_COGNITO__?.userPoolId ||
        import.meta.env['VITE_COGNITO_USER_POOL_ID'] ||
        '',

    COGNITO_CLIENT_ID:
        window.__RUNTIME_COGNITO__?.clientId ||
        import.meta.env['VITE_COGNITO_CLIENT_ID'] ||
        '',

    COGNITO_REGION:
        window.__RUNTIME_COGNITO__?.region ||
        import.meta.env['VITE_COGNITO_REGION'] ||
        'ap-southeast-2',

    // ── Environment flags ─────────────────────────────────────────────────────
    ENVIRONMENT:
        import.meta.env['VITE_ENVIRONMENT'] || 'development',

    IS_PRODUCTION:
        import.meta.env['VITE_ENVIRONMENT'] === 'production',

    IS_DEVELOPMENT:
        import.meta.env['VITE_ENVIRONMENT'] === 'development',

    ENABLE_MOCKS:
        import.meta.env['VITE_ENABLE_MOCKS'] !== 'false',
} as const;
