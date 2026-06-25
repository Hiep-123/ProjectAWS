import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './index.css'

/**
 * Runtime configuration bootstrap
 *
 * When deployed to CloudFront + S3 via FrontendStack, CDK writes a
 * /config.json file containing { "apiUrl": "<API Gateway URL>" }.
 * Fetching it here — before React mounts — means no component ever
 * sees an undefined API URL, and we can update the URL without
 * rebuilding the frontend bundle.
 *
 * In local development, /config.json does not exist, so we fall back
 * to VITE_API_URL from .env (already set in constants.ts).
 */
async function bootstrap(): Promise<void> {
    try {
        const res = await fetch('/config.json')
        if (res.ok) {
            const config = await res.json() as { apiUrl?: string }
            if (config.apiUrl) {
                // Expose on window so constants.ts / axios picks it up.
                // This must be set before any module reads API_BASE_URL.
                (window as Window & { __RUNTIME_API_URL__?: string }).__RUNTIME_API_URL__ = config.apiUrl
            }
        }
    } catch {
        // config.json absent (local dev) — proceed with VITE_API_URL from .env
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
