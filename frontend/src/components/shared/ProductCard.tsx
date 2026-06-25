import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Star, TrendingUp, Zap } from 'lucide-react'
import { Button, Badge } from '@components/ui'
import { Product } from '@types'
import { formatCurrency } from '@lib/utils'
import { useCart } from '@contexts'

interface ProductCardProps {
    product: Product
    showAddToCart?: boolean
    badge?: string
}

const ProductCard: React.FC<ProductCardProps> = ({ product, showAddToCart = true, badge }) => {
    const { addItem } = useCart()
    const discount = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        addItem({
            productId: product.id,
            productName: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
        })
    }

    return (
        <Link to={`/products/${product.id}`} className="group block">
            <div className="relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                    />
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                        {badge && (
                            <Badge className="text-xs font-semibold bg-primary text-primary-foreground">
                                {badge}
                            </Badge>
                        )}
                        {discount > 0 && (
                            <Badge variant="destructive" className="text-xs font-semibold">
                                -{discount}%
                            </Badge>
                        )}
                        {product.stock <= 5 && product.stock > 0 && (
                            <Badge variant="outline" className="text-xs bg-background">
                                Only {product.stock} left
                            </Badge>
                        )}
                        {product.stock === 0 && (
                            <Badge variant="secondary" className="text-xs">
                                Out of Stock
                            </Badge>
                        )}
                    </div>
                    {/* Quick add */}
                    {showAddToCart && product.stock > 0 && (
                        <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                            <Button
                                onClick={handleAddToCart}
                                className="w-full rounded-none rounded-b-xl h-10 text-sm gap-2"
                                size="sm"
                            >
                                <ShoppingCart className="h-4 w-4" />
                                Add to Cart
                            </Button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                    <p className="text-xs text-muted-foreground capitalize font-medium tracking-wide">
                        {product.category}
                    </p>
                    <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-snug group-hover:text-primary transition-colors">
                        {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5">
                        <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-3.5 w-3.5 ${
                                        i < Math.floor(product.rating)
                                            ? 'fill-primary text-primary'
                                            : 'fill-muted text-muted-foreground'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {product.rating} ({product.reviews})
                        </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 pt-1">
                        <span className="text-lg font-bold text-foreground">
                            {formatCurrency(product.price)}
                        </span>
                        {product.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                                {formatCurrency(product.originalPrice)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}

interface FeaturedProductCardProps {
    product: Product
    rank?: number
}

export const FeaturedProductCard: React.FC<FeaturedProductCardProps> = ({ product, rank }) => {
    return (
        <Link to={`/products/${product.id}`} className="group flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                />
                {rank && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                        <span className="text-white font-bold text-lg">#{rank}</span>
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{product.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-xs text-muted-foreground">{product.rating}</span>
                    <span className="text-xs text-muted-foreground">({product.reviews})</span>
                </div>
                <p className="font-bold text-sm mt-1">{formatCurrency(product.price)}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
                {product.originalPrice && (
                    <Badge variant="destructive" className="text-xs">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                    </Badge>
                )}
                <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
        </Link>
    )
}

export const ProductCardSkeleton: React.FC = () => (
    <div className="rounded-xl border border-border overflow-hidden animate-pulse">
        <div className="aspect-square bg-muted" />
        <div className="p-4 space-y-3">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-5 bg-muted rounded w-1/4" />
        </div>
    </div>
)

export { ProductCard }
export default ProductCard
