import React from 'react'
import { cn, getStatusColor } from '@lib/utils'
import { ORDER_STATUS_LABELS } from '@lib/constants'

interface StatusBadgeProps {
    status: string
    className?: string
    size?: 'sm' | 'md' | 'lg'
    dot?: boolean
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = 'md', dot = false }) => {
    const label = ORDER_STATUS_LABELS[status.toLowerCase().replace(' ', '_')] || status
    const colorClass = getStatusColor(status)

    const sizeClasses = {
        sm: 'text-xs px-1.5 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5',
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full font-medium',
                colorClass,
                sizeClasses[size],
                className
            )}
        >
            {dot && (
                <span
                    className={cn(
                        'h-1.5 w-1.5 rounded-full bg-current flex-shrink-0'
                    )}
                />
            )}
            {label}
        </span>
    )
}

export default StatusBadge
