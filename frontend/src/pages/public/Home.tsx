import React from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, CardContent, Skeleton } from '@components/ui'
import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { useTrendingProducts, useBestSellers } from '@hooks/queries'
import { PRODUCT_CATEGORIES } from '@lib/constants'

/**
 * Home page for browsing featured products and categories.
 */
const Home: React.FC = () => {
    const { data: trending } = useTrendingProducts()
    const { data: bestSellers } = useBestSellers()

    const productHref = (p: { id: string; slug?: string }) =>
        `/products/${p.slug ?? p.id}`

    const features = [
        {
            icon: Truck,
            title: 'Fast delivery',
            description: 'Nhanh chóng, tiện lợi và luôn cập nhật trạng thái đơn hàng.'
        },
        {
            icon: ShieldCheck,
            title: 'Secure checkout',
            description: 'Thanh toán an toàn với trải nghiệm mua sắm mượt mà.'
        },
        {
            icon: Sparkles,
            title: 'Curated picks',
            description: 'Những sản phẩm được tuyển chọn kỹ lưỡng cho trải nghiệm tốt nhất.'
        }
    ]

    return (
        <div className="space-y-8 md:space-y-12">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.25),_transparent_45%)]" />
                <div className="relative container mx-auto flex flex-col gap-8 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-8 md:py-20 lg:px-10">
                    <div className="max-w-2xl space-y-5">
                        <div className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur">
                            ⚡ New season arrivals
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                                Discover premium tech that feels effortless.
                            </h1>
                            <p className="max-w-xl text-lg text-primary-foreground/90 md:text-xl">
                                Khám phá các sản phẩm công nghệ mới nhất, được thiết kế để nâng tầm trải nghiệm mua sắm của bạn.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link to="/products">
                                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                                    Shop now
                                </Button>
                            </Link>
                            <Link to="/products?category=accessories">
                                <Button size="lg" variant="outline" className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 sm:w-auto">
                                    Explore accessories
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-background/10 p-5 backdrop-blur">
                        <div className="rounded-2xl bg-white/95 p-5 text-foreground shadow-lg">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                Why shoppers love us
                            </p>
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between rounded-xl bg-muted/70 px-3 py-2">
                                    <span className="text-sm font-medium">Free returns</span>
                                    <span className="text-sm font-semibold text-primary">30 days</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-muted/70 px-3 py-2">
                                    <span className="text-sm font-medium">Customer satisfaction</span>
                                    <span className="text-sm font-semibold text-primary">4.9/5</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-muted/70 px-3 py-2">
                                    <span className="text-sm font-medium">Support</span>
                                    <span className="text-sm font-semibold text-primary">24/7</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-4">
                <div className="grid gap-4 md:grid-cols-3">
                    {features.map(feature => {
                        const Icon = feature.icon
                        return (
                            <div key={feature.title} className="rounded-2xl border bg-card p-5 shadow-sm">
                                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-semibold">{feature.title}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                        )
                    })}
                </div>
            </section>

            <section className="container mx-auto px-4">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Browse by category</p>
                        <h2 className="text-2xl font-bold">Shop by category</h2>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {PRODUCT_CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                        <Link key={cat.value} to={`/products?category=${cat.value}`}>
                            <Card className="cursor-pointer border border-border/70 transition-all hover:border-primary hover:shadow-md">
                                <CardContent className="space-y-2 p-4 text-center">
                                    <span className="text-2xl">{cat.icon}</span>
                                    <p className="text-sm font-semibold">{cat.label}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="container mx-auto px-4 pb-2">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Top sellers</p>
                        <h2 className="text-2xl font-bold">Best sellers</h2>
                    </div>
                    <Link to="/products" className="text-sm font-medium text-primary hover:underline">
                        See more
                    </Link>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {bestSellers ? (
                        bestSellers.slice(0, 4).map(product => (
                            <Link key={product.id} to={productHref(product)}>
                                <Card className="overflow-hidden border-0 shadow-md transition-transform hover:-translate-y-1 hover:shadow-lg">
                                    <div className="h-48 overflow-hidden bg-muted">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                        />
                                    </div>
                                    <CardContent className="space-y-2 p-4">
                                        <h3 className="line-clamp-2 text-sm font-semibold">{product.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {product.reviews} reviews
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-foreground">${product.price}</p>
                                            <Button size="sm" variant="ghost" className="h-8 px-2">
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80" />)
                    )}
                </div>
            </section>

            <section className="container mx-auto px-4">
                <div className="rounded-3xl border border-border/70 bg-muted/40 px-6 py-10 text-center shadow-sm md:px-10">
                    <h2 className="text-2xl font-bold">Stay in the loop</h2>
                    <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                        Đăng ký nhận ưu đãi mới nhất, sản phẩm giới hạn và cập nhật từ NexaStore.
                    </p>
                    <div className="mx-auto mt-6 flex max-w-lg flex-col gap-3 sm:flex-row">
                        <input
                            type="email"
                            placeholder="Email của bạn"
                            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 outline-none ring-0 focus:border-primary"
                        />
                        <Button className="rounded-full">Subscribe</Button>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Home
