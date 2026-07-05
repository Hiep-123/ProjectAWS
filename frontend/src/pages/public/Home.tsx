import React from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, CardContent, Skeleton } from '@components/ui'
import { Star } from 'lucide-react'
import { useTrendingProducts, useBestSellers } from '@hooks/queries'
import { PRODUCT_CATEGORIES } from '@lib/constants'

/**
 * Home page for browsing featured products and categories.
 */
const Home: React.FC = () => {
    const { data: trending } = useTrendingProducts()
    const { data: bestSellers } = useBestSellers()

    // Helper: resolve the URL segment for a product (slug or id)
    const productHref = (p: { id: string; slug?: string }) =>
        `/products/${p.slug ?? p.id}`

    return (
        <div className="space-y-12">
            {/* Hero Banner */}
            <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20 px-4 rounded-lg">
                <div className="container mx-auto max-w-4xl text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold">Welcome to NexaStore</h1>
                    <p className="text-lg md:text-xl opacity-90">
                        Discover premium tech products — powered by AWS Serverless
                    </p>
                    <Link to="/products">
                        <Button size="lg" variant="secondary">Shop Now</Button>
                    </Link>
                </div>
            </section>

            {/* Categories — sourced from PRODUCT_CATEGORIES constant */}
            <section className="container mx-auto px-4">
                <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {PRODUCT_CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                        <Link
                            key={cat.value}
                            to={`/products?category=${cat.value}`}
                        >
                            <Card className="hover:border-primary cursor-pointer transition-colors">
                                <CardContent className="p-4 text-center space-y-1">
                                    <span className="text-2xl">{cat.icon}</span>
                                    <p className="font-semibold text-sm">{cat.label}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Trending Products */}
            <section className="container mx-auto px-4">
                <h2 className="text-2xl font-bold mb-6">Trending Products</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {trending ? (
                        trending.slice(0, 4).map(product => (
                            <Link key={product.id} to={productHref(product)}>
                                <Card className="hover:border-primary transition-colors overflow-hidden">
                                    <div className="h-48 bg-muted overflow-hidden">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                                        />
                                    </div>
                                    <CardContent className="p-4 space-y-2">
                                        <h3 className="font-semibold line-clamp-2 text-sm">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-bold text-primary">
                                                ${product.price.toFixed(2)}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-primary text-primary" />
                                                <span className="text-sm">{product.rating}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-80" />
                        ))
                    )}
                </div>
            </section>

            {/* Best Sellers */}
            <section className="container mx-auto px-4">
                <h2 className="text-2xl font-bold mb-6">Best Sellers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {bestSellers ? (
                        bestSellers.slice(0, 4).map(product => (
                            <Link key={product.id} to={productHref(product)}>
                                <Card className="hover:border-primary transition-colors overflow-hidden">
                                    <div className="h-48 bg-muted overflow-hidden">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                                        />
                                    </div>
                                    <CardContent className="p-4 space-y-2">
                                        <h3 className="font-semibold line-clamp-2 text-sm">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {product.reviews} reviews
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-80" />
                        ))
                    )}
                </div>
            </section>

            {/* Newsletter */}
            <section className="bg-muted/50 py-12 px-4 rounded-lg">
                <div className="container mx-auto max-w-2xl text-center space-y-4">
                    <h2 className="text-2xl font-bold">Subscribe to Our Newsletter</h2>
                    <p className="text-muted-foreground">
                        Get the latest updates on new products and offers
                    </p>
                    <div className="flex gap-2 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-4 py-2 rounded border border-border"
                        />
                        <Button>Subscribe</Button>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Home
