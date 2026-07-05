import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { AuthProvider } from '@contexts'
import { CartProvider } from '@contexts'
import { ThemeProvider } from '@contexts'
import Routes from '@routes'
import ErrorBoundary from '@components/shared/ErrorBoundary'
import { Toaster } from '@components/ui/toaster'

// Create a client for TanStack Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
})

/**
 * Main App Component
 * Sets up all providers and routing
 */
const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <CartProvider>
                            <BrowserRouter>
                                <Routes />
                                <Toaster />
                            </BrowserRouter>
                        </CartProvider>
                    </AuthProvider>
                </QueryClientProvider>
            </ThemeProvider>
        </ErrorBoundary>
    )
}

export default App
