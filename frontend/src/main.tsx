import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './index.css'

/**
 * Load runtime configuration before the app mounts so the SPA can use the deployed API and Cognito settings.
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
