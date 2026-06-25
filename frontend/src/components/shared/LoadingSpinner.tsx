import React from 'react'
import { cn } from '@lib/utils'

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
    label?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className, label }) => {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-3',
        xl: 'h-16 w-16 border-4',
    }

    return (
        <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
            <div
                className={cn(
                    'animate-spin rounded-full border-muted border-t-primary',
                    sizeClasses[size]
                )}
                role="status"
                aria-label={label || 'Loading'}
            />
            {label && <p className="text-sm text-muted-foreground animate-pulse">{label}</p>}
        </div>
    )
}

export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-muted animate-spin border-t-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">N</span>
                </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{message}</p>
        </div>
    </div>
)

export default LoadingSpinner
