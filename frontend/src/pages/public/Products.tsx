import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProducts } from '@hooks/queries/useProducts'
import ProductCard, { ProductCardSkeleton } from '@components/shared/ProductCard'
import PageHeader from '@components/shared/PageHeader'
import SearchInput from '@components/shared/SearchInput'
import {
    Button,
    Separator,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@components/ui'
import { Check, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { PRODUCT_CATEGORIES, SORT_OPTIONS } from '@lib/constants'

/**
 * Product listing page with category, search, sort, and price filters.
 */

const MAX_PRICE = 3000

const Products: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [showFilters, setShowFilters] = useState(false)
    const [page, setPage] = useState(1)

    // ── Read initial state from URL ───────────────────────────────────────
    const [search, setSearch] = useState(searchParams.get('search') ?? '')
    const [category, setCategory] = useState(searchParams.get('category') ?? 'all')
    const [sort, setSort] = useState(searchParams.get('sort') ?? 'default')
    const [maxPrice, setMaxPrice] = useState<number>(
        Number(searchParams.get('maxPrice') ?? MAX_PRICE),
    )

    // ── Sync state → URL whenever filters change ──────────────────────────
    useEffect(() => {
        const params: Record<string, string> = {}
        if (search) params['search'] = search
        if (category !== 'all') params['category'] = category
        if (sort !== 'default') params['sort'] = sort
        if (maxPrice < MAX_PRICE) params['maxPrice'] = String(maxPrice)
        setSearchParams(params, { replace: true })
        setPage(1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, category, sort, maxPrice])

    // ── Query params for the hook / service ───────────────────────────────
    const params = {
        page,
        pageSize: 9,
        search: search || undefined,
        category: category !== 'all' ? category : undefined,
        sort: sort !== 'default' ? sort : undefined,
        maxPrice: maxPrice < MAX_PRICE ? maxPrice : undefined,
    }

    const { data, isLoading, isError, refetch } = useProducts(params)

    const handleClearFilters = () => {
        setSearch('')
        setCategory('all')
        setSort('default')
        setMaxPrice(MAX_PRICE)
        setPage(1)
    }

    return (
        <div className="container py-8 max-w-7xl">
            <PageHeader
                title="Explore Products"
                description="Browse our high-quality tech inventory"
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

                    {/* Sort options */}
                    <Select
                        value={sort}
                        onValueChange={(val) => setSort(val)}
                    >
                        <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filter Sidebar */}
                <div
                    className={`lg:block space-y-6 ${showFilters
                        ? 'block fixed inset-0 z-50 bg-background p-6 overflow-y-auto'
                        : 'hidden'
                        }`}
                >
                    <div className="flex items-center justify-between lg:hidden mb-4">
                        <h3 className="font-bold text-lg">Filters</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFilters(false)}
                        >
                            Close
                        </Button>
                    </div>

                    {/* Live search */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Search</label>
                        <SearchInput
                            value={search}
                            onChange={(val) => setSearch(val)}
                            placeholder="Search products..."
                        />
                    </div>

                    <Separator />

                    {/* Category filters */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-semibold text-foreground">
                            Categories
                        </label>
                        <div className="flex flex-col gap-1.5">
                            {PRODUCT_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => {
                                        setCategory(cat.value)
                                        if (showFilters) setShowFilters(false)
                                    }}
                                    className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left ${category === cat.value
                                        ? 'bg-primary/10 text-primary font-semibold'
                                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <span>
                                        {cat.icon}&nbsp;&nbsp;{cat.label}
                                    </span>
                                    {category === cat.value && (
                                        <Check className="h-4 w-4" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Price filter */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-foreground">
                            Max Price
                        </label>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">$0</span>
                                <input
                                    type="range"
                                    min="0"
                                    max={MAX_PRICE}
                                    step="50"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                                    className="w-full accent-primary bg-muted rounded-lg appearance-none cursor-pointer h-2"
                                />
                                <span className="text-xs text-muted-foreground">
                                    ${MAX_PRICE}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold text-foreground bg-muted/50 p-2 rounded-md">
                                <span>Max:</span>
                                <span className="text-primary">${maxPrice}</span>
                            </div>
                        </div>
                    </div>

                    <Separator />

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
                            <Button onClick={() => refetch()} size="sm">
                                Retry
                            </Button>
                        </div>
                    ) : !data || data.data.length === 0 ? (
                        <div className="text-center py-24 space-y-4">
                            <h3 className="text-2xl font-bold">No Products Found</h3>
                            <p className="text-muted-foreground text-sm max-w-md mx-auto">
                                Try adjusting your search or filters.
                            </p>
                            <Button
                                onClick={handleClearFilters}
                                variant="outline"
                                size="sm"
                            >
                                Reset Filters
                            </Button>
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
                                        {(page - 1) * params.pageSize + 1}–
                                        {Math.min(page * params.pageSize, data.total)} of{' '}
                                        {data.total}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === 1}
                                            onClick={() => setPage(p => p - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page * params.pageSize >= data.total}
                                            onClick={() => setPage(p => p + 1)}
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
