import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
    plugins: [react()],

    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
            '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
            '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
            '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
            '@contexts': fileURLToPath(new URL('./src/contexts', import.meta.url)),
            '@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
            '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
            '@mock': fileURLToPath(new URL('./src/mock', import.meta.url)),
            '@routes': fileURLToPath(new URL('./src/routes', import.meta.url)),
            '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
            '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
            '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
        },
    },

    server: {
        port: 5173,
        open: true,
    },

    build: {
        outDir: 'dist',
        // 'hidden' emits .map files but does NOT reference them in the bundle —
        // source maps can be uploaded to a private error tracking service (e.g.
        // Sentry) without being publicly accessible via CloudFront.
        sourcemap: 'hidden',
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': [
                        'react',
                        'react-dom',
                        'react-router-dom',
                    ],
                    'query-vendor': [
                        '@tanstack/react-query',
                    ],
                    'ui-vendor': [
                        'lucide-react',
                        'recharts',
                    ],
                },
            },
        },
    },
})