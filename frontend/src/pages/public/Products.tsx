import React, { useState } from 'react'
import { useProducts } from '@hooks/queries/useProducts'
import ProductCard, { ProductCardSkeleton } from '@components/shared/ProductCard'
import PageHeader from '@components/shared/PageHeader'
import SearchInput from '@components/shared/SearchInput'
import { Button, Badge, Separator, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@components/ui'
import { SlidersHorizontal, Check, Star, RefreshCw } from 'lucide-react'

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Beauty']

const Products: React.FC = () => {
    // State filters
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [minPrice, setMinPrice] = useState<number>(0)
    const [maxPrice, setMaxPrice] = useState<number>(2000)
    const [sortBy, setSortBy] = useState<string>('featured')
    const [showFilters, setShowFilters] = useState(false)

    // Query parameters
    const params = {
        page,
        pageSize: 8,
        search: search || undefined,
        category: category === 'All' ? undefined : category.toLowerCase(),
        minPrice: minPrice > 0 ? minPrice : undefined,
        maxPrice: maxPrice < 2000 ? maxPrice : undefined,
    }

    const { data, isLoading, isError, refetch } = useProducts(params)

    const handleClearFilters = () => {
        setSearch('')
        setCategory('All')
        setMinPrice(0)
        setMaxPrice(2000)
        setSortBy('featured')
        setPage(1)
    }

    return (
        <div className="container py-8 max-w-7xl">
            <PageHeader
                title="Explore Products"
                description="Browse our high-quality inventory curated for absolute reliability and style"
                breadcrumbs={[{ label: 'Products' }]}
            >
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="lg:hidden gap-1.5"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                    </Button>
                    <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setPage(1) }}>
                        <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="featured">Featured</SelectItem>
                            <SelectItem value="price-asc">Price: Low to High</SelectItem>
                            <SelectItem value="price-desc">Price: High to Low</SelectItem>
                            <SelectItem value="rating-desc">Highest Rated</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Desktop Filters Sidebar */}
                <div className={`lg:block space-y-6 ${showFilters ? 'block fixed inset-0 z-50 bg-background p-6 overflow-y-auto' : 'hidden'}`}>
                    <div className="flex items-center justify-between lg:hidden mb-4">
                        <h3 className="font-bold text-lg">Filters</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>Close</Button>
                    </div>

                    {/* Search */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Search</label>
                        <SearchInput
                            value={search}
                            onChange={(val) => { setSearch(val); setPage(1) }}
                            placeholder="Search catalog..."
                        />
                    </div>

                    <Separator />

                    {/* Categories */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-semibold text-foreground">Categories</label>
                        <div className="flex flex-col gap-1.5">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => { setCategory(cat); setPage(1); if (showFilters) setShowFilters(false) }}
                                    className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left ${
                                        category === cat
                                            ? 'bg-primary/10 text-primary font-semibold'
                                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {cat}
                                    {category === cat && <Check className="h-4 w-4" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Price Filter */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-foreground">Price Limit</label>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">$0</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="2000"
                                    step="50"
                                    value={maxPrice}
                                    onChange={(e) => { setMaxPrice(Number(e.target.value)); setPage(1) }}
                                    className="w-full accent-primary bg-muted rounded-lg appearance-none cursor-pointer h-2"
                                />
                                <span className="text-xs text-muted-foreground">$2000</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold text-foreground bg-muted/50 p-2 rounded-md">
                                <span>Max Price:</span>
                                <span className="text-primary">${maxPrice}</span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Reset Button */}
                    <Button
                        variant="outline"
                        className="w-full text-xs font-semibold gap-1.5 h-9"
                        onClick={handleClearFilters}
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Clear All Filters
                    </Button>
                </div>

                {/* Products Grid */}
                <div className="lg:col-span-3 space-y-8">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : isError ? (
                        <div className="text-center py-12 space-y-4 border border-dashed rounded-lg bg-card/30">
                            <h3 className="text-xl font-bold">Failed to load products</h3>
                            <p className="text-muted-foreground text-sm">Please try refetching the catalog.</p>
                            <Button onClick={() => refetch()} size="sm">Retry</Button>
                        </div>
                    ) : !data || data.data.length === 0 ? (
                        <div className="text-center py-24 space-y-4">
                            <h3 className="text-2xl font-bold text-foreground">No Products Found</h3>
                            <p className="text-muted-foreground text-sm max-w-md mx-auto">
                                We couldn't find any products matching your filters. Try search terms or resetting the controls.
                            </p>
                            <Button onClick={handleClearFilters} variant="outline" size="sm">Reset Filters</Button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {data.data.map((prod: any) => (
                                    <ProductCard key={prod.id} product={prod} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {data.total > params.pageSize && (
                                <div className="flex items-center justify-between border-t pt-6">
                                    <span className="text-sm text-muted-foreground">
                                        Showing {(page - 1) * params.pageSize + 1} -{' '}
                                        {Math.min(page * params.pageSize, data.total)} of {data.total} items
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === 1}
                                            onClick={() => setPage(page - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page * params.pageSize >= data.total}
                                            onClick={() => setPage(page + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Products
