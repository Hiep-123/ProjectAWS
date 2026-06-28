import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './index.css'

/**
 * Runtime configuration bootstrap — Phase 7 + Phase 10
 *
 * When deployed to CloudFront + S3 via FrontendStack, CDK writes a
 * /config.json file containing:
 *   {
 *     "apiUrl":  "<API Gateway URL>",
 *     "cognito": { "userPoolId": "...", "clientId": "...", "region": "..." }
 *   }
 *
 * Fetching it here — before React mounts — ensures:
 *   1. No component sees an undefined API URL or Cognito config.
 *   2. Config can change without rebuilding the frontend bundle.
 *   3. Cognito IDs are no longer stored in the source-tracked .env file.
 *
 * In local development, /config.json does not exist. The app falls back to
 * VITE_* variables from frontend/.env (never committed with real values).
 *
 * Global window augmentation is defined in src/types/runtime-config.d.ts.
 */

interface RuntimeConfig {
    apiUrl?: string
    cognito?: {
        userPoolId: string
        clientId: string
        region: string
    }
}

async function bootstrap(): Promise<void> {
    try {
        const res = await fetch('/config.json')
        if (res.ok) {
            const config = await res.json() as RuntimeConfig

            // 1. API URL — read by constants.ts → axios-instance.ts
            if (config.apiUrl) {
                window.__RUNTIME_API_URL__ = config.apiUrl
            }

            // 2. Cognito config — read by env.ts → cognito.ts
            if (config.cognito?.userPoolId && config.cognito?.clientId) {
                window.__RUNTIME_COGNITO__ = {
                    userPoolId: config.cognito.userPoolId,
                    clientId: config.cognito.clientId,
                    region: config.cognito.region ?? 'ap-southeast-1',
                }
            }
        }
    } catch {
        // config.json absent (local dev) — fall back to VITE_* vars from .env
    }

    const rootElement = document.getElementById('root')
    if (!rootElement) {
        throw new Error('Failed to find the root element')
    }

    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    )
}

bootstrap()
