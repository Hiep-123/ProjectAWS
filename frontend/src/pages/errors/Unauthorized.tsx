import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

const Unauthorized: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-6">
                <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black mb-2">401 — Unauthorized</h1>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
                You need to be logged in to access this page. Please log in with your credentials to continue.
            </p>
            <div className="flex gap-4">
                <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    Go to Login
                </Link>
                <Link
                    to="/"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    )
}

export default Unauthorized
