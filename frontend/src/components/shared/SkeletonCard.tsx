import React from 'react'
import { Card, CardContent, CardFooter, Skeleton } from '@components/ui'

const SkeletonCard: React.FC = () => {
    return (
        <Card className="h-full overflow-hidden flex flex-col border border-border/40">
            {/* Image Skeleton */}
            <div className="relative aspect-square w-full bg-muted">
                <Skeleton className="h-full w-full" />
            </div>

            <CardContent className="p-4 flex-1 space-y-3">
                {/* Category Skeleton */}
                <Skeleton className="h-4 w-1/4 rounded" />

                {/* Title Skeleton */}
                <div className="space-y-1">
                    <Skeleton className="h-5 w-full rounded" />
                    <Skeleton className="h-5 w-4/5 rounded" />
                </div>

                {/* Rating Skeleton */}
                <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="w-3.5 h-3.5 rounded-full" />
                        ))}
                    </div>
                    <Skeleton className="h-4 w-8 rounded ml-1" />
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex items-center justify-between gap-4">
                {/* Price Skeleton */}
                <Skeleton className="h-6 w-20 rounded" />
                {/* Button Skeleton */}
                <Skeleton className="h-9 w-24 rounded-md" />
            </CardFooter>
        </Card>
    )
}

export default SkeletonCard
