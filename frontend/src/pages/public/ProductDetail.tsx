import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProduct, useRelatedProducts } from '@hooks/queries/useProducts'
import { useCart } from '@contexts'
import ImageGallery from '@components/shared/ImageGallery'
import ProductCard from '@components/shared/ProductCard'
import LoadingSpinner from '@components/shared/LoadingSpinner'
import PageHeader from '@components/shared/PageHeader'
import { Button, Badge, Separator } from '@components/ui'
import { Star, ShoppingCart, ShieldCheck, Truck, RefreshCw, StarHalf } from 'lucide-react'
import { formatCurrency } from '@lib/utils'

const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { addItem } = useCart()
    const [quantity, setQuantity] = useState(1)

    const { data: product, isLoading, isError } = useProduct(id)
    const { data: relatedProducts } = useRelatedProducts(id)

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex-center">
                <LoadingSpinner size="lg" label="Retrieving product details..." />
            </div>
        )
    }

    if (isError || !product) {
        return (
            <div className="container py-16 text-center space-y-4 max-w-md">
                <h2 className="text-2xl font-bold">Product Not Found</h2>
                <p className="text-muted-foreground text-sm">
                    The product you are looking for might have been discontinued or does not exist.
                </p>
                <Button onClick={() => navigate('/products')} className="w-full">
                    Return to Shop
                </Button>
            </div>
        )
    }

    const discount = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0

    const handleAddToCart = () => {
        addItem({
            productId: product.id,
            productName: product.name,
            price: product.price,
            image: product.image,
            quantity,
        })
    }

    // Default features if not provided in mock
    const specs = [
        { name: 'Model Version', value: 'Enterprise Standard (2024)' },
        { name: 'Architecture Compatibility', value: 'AWS Well-Architected Integration' },
        { name: 'Material / Component Build', value: 'SaaS Resilient Grade' },
        { name: 'Shipping Weight', value: '1.2 lbs' },
    ]

    return (
        <div className="container py-8 max-w-7xl">
            <PageHeader
                title={product.name}
                breadcrumbs={[
                    { label: 'Products', href: '/products' },
                    { label: product.name },
                ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-16">
                {/* Images */}
                <div className="space-y-4">
                    <ImageGallery
                        images={product.images && product.images.length > 0 ? product.images : [product.image]}
                        alt={product.name}
                    />
                </div>

                {/* Details */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Badge variant="outline" className="capitalize text-xs font-semibold px-2.5 py-0.5 bg-muted">
                            {product.category}
                        </Badge>
                        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">{product.name}</h1>
                    </div>

                    {/* Ratings */}
                    <div className="flex items-center gap-2">
                        <div className="flex text-primary">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                        i < Math.floor(product.rating)
                                            ? 'fill-primary'
                                            : 'fill-muted text-muted'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-sm font-semibold text-foreground">{product.rating}</span>
                        <span className="text-sm text-muted-foreground">({product.reviews || 0} reviews)</span>
                    </div>

                    {/* Price */}
                    <div className="space-y-1 bg-muted/30 p-4 rounded-xl border border-border/30">
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-extrabold text-foreground">
                                {formatCurrency(product.price)}
                            </span>
                            {product.originalPrice && (
                                <span className="text-lg text-muted-foreground line-through">
                                    {formatCurrency(product.originalPrice)}
                                </span>
                            )}
                            {discount > 0 && (
                                <Badge variant="destructive" className="font-semibold text-xs animate-pulse">
                                    SAVE {discount}%
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Free shipping on orders above $50. Local tax calculated at checkout.</p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Description</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
                    </div>

                    <Separator />

                    {/* Specifications */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Specifications</h3>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                            {specs.map((spec, idx) => (
                                <React.Fragment key={idx}>
                                    <div className="text-muted-foreground font-medium">{spec.name}</div>
                                    <div className="text-foreground font-semibold text-right">{spec.value}</div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Stock Status & Quantity controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-muted-foreground">Qty:</span>
                            <div className="flex items-center border rounded-md">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity === 1}
                                    className="h-9 w-9"
                                >
                                    -
                                </Button>
                                <span className="w-10 text-center font-semibold text-sm">{quantity}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                    disabled={quantity >= product.stock}
                                    className="h-9 w-9"
                                >
                                    +
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center gap-3">
                            {product.stock > 0 ? (
                                <Button
                                    onClick={handleAddToCart}
                                    className="w-full gap-2 h-11 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                    size="lg"
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    Add to Cart
                                </Button>
                            ) : (
                                <Button variant="secondary" disabled className="w-full h-11 text-sm">
                                    Out of Stock
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Features Badges */}
                    <div className="grid grid-cols-3 gap-4 border-t pt-6 text-center text-xs font-semibold text-muted-foreground">
                        <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <span>1 Year Warranty</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                            <Truck className="w-5 h-5 text-primary" />
                            <span>Expedited Delivery</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                            <RefreshCw className="w-5 h-5 text-primary" />
                            <span>30 Day Returns</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related products */}
            {relatedProducts && relatedProducts.length > 0 && (
                <div className="space-y-6 pt-8 border-t">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">You May Also Like</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {relatedProducts.slice(0, 4).map((related) => (
                            <ProductCard key={related.id} product={related} showAddToCart={false} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductDetail
