/**
 * runtime-config.d.ts
 *
 * Global window augmentation for runtime configuration values injected
 * by CDK FrontendStack via /config.json at deploy time.
 *
 * Values are set in src/main.tsx bootstrap() before React mounts.
 * Any module can read them synchronously after that point.
 */

interface RuntimeCognitoConfig {
    userPoolId: string;
    clientId: string;
    region: string;
}

declare global {
    interface Window {
        /** API Gateway base URL — injected from config.json at deploy time. */
        __RUNTIME_API_URL__?: string;
        /** Cognito pool/client config — injected from config.json at deploy time. */
        __RUNTIME_COGNITO__?: RuntimeCognitoConfig;
    }
}

// Make this file a module so the global augmentation is applied correctly.
export { };
