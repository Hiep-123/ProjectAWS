import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { cn } from '@lib/utils'
import { Button } from '@components/ui'

interface ImageGalleryProps {
    images: string[]
    alt: string
    className?: string
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, alt, className }) => {
    const [activeIndex, setActiveIndex] = useState(0)
    const [isZoomed, setIsZoomed] = useState(false)

    const prev = () => setActiveIndex((i) => (i - 1 + images.length) % images.length)
    const next = () => setActiveIndex((i) => (i + 1) % images.length)

    if (!images || images.length === 0) return null

    return (
        <div className={cn('space-y-4', className)}>
            {/* Main Image */}
            <div
                className="relative aspect-square overflow-hidden rounded-xl bg-muted cursor-zoom-in group"
                onClick={() => setIsZoomed(true)}
            >
                <img
                    src={images[activeIndex]}
                    alt={`${alt} - image ${activeIndex + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <ZoomIn className="h-8 w-8 text-white" />
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); prev() }}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); next() }}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        {activeIndex + 1} / {images.length}
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            className={cn(
                                'relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                                i === activeIndex
                                    ? 'border-primary ring-2 ring-primary/30'
                                    : 'border-border hover:border-muted-foreground'
                            )}
                        >
                            <img
                                src={img}
                                alt={`${alt} thumbnail ${i + 1}`}
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {isZoomed && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setIsZoomed(false)}
                >
                    <img
                        src={images[activeIndex]}
                        alt={alt}
                        className="max-h-full max-w-full object-contain rounded-lg"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white hover:bg-white/20"
                        onClick={() => setIsZoomed(false)}
                    >
                        ✕
                    </Button>
                </div>
            )}
        </div>
    )
}

export default ImageGallery
