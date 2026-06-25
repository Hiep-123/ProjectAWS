import React, { useState, useMemo } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './table'
import { Button } from './button'
import { Input } from './input'
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    SlidersHorizontal,
} from 'lucide-react'

interface ColumnDef<T> {
    accessorKey: keyof T | string
    header: string | React.ReactNode
    cell: (item: T) => React.ReactNode
    sortable?: boolean
}

interface DataTableProps<T> {
    columns: ColumnDef<T>[]
    data: T[]
    searchKey?: keyof T & string
    searchPlaceholder?: string
    onRowClick?: (item: T) => void
    pageSize?: number
    filterOptions?: {
        key: keyof T & string
        label: string
        options: { label: string; value: string | boolean }[]
    }
}

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    searchKey,
    searchPlaceholder = 'Search...',
    onRowClick,
    pageSize = 10,
    filterOptions,
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState('')
    const [sortKey, setSortKey] = useState<string | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [currentPage, setCurrentPage] = useState(1)
    const [activeFilter, setActiveFilter] = useState<string>('all')

    // Handle sort
    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDirection('asc')
        }
        setCurrentPage(1)
    }

    // Filter and search logic
    const filteredData = useMemo(() => {
        let result = [...data]

        // Filter by option dropdown if applicable
        if (filterOptions && activeFilter !== 'all') {
            result = result.filter(item => {
                const val = item[filterOptions.key]
                return String(val) === activeFilter
            })
        }

        // Search filter
        if (searchQuery && searchKey) {
            const query = searchQuery.toLowerCase()
            result = result.filter(item => {
                const value = item[searchKey]
                if (value === undefined || value === null) return false
                return String(value).toLowerCase().includes(query)
            })
        }

        // Sorting logic
        if (sortKey) {
            result.sort((a, b) => {
                const valA = a[sortKey]
                const valB = b[sortKey]

                if (valA === undefined || valA === null) return 1
                if (valB === undefined || valB === null) return -1

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortDirection === 'asc' ? valA - valB : valB - valA
                }

                return sortDirection === 'asc'
                    ? String(valA).localeCompare(String(valB))
                    : String(valB).localeCompare(String(valA))
            })
        }

        return result
    }, [data, searchQuery, searchKey, sortKey, sortDirection, activeFilter, filterOptions])

    // Pagination
    const totalPages = Math.ceil(filteredData.length / pageSize) || 1
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, currentPage, pageSize])

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {searchKey && (
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={e => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="pl-9"
                        />
                    </div>
                )}

                {filterOptions && (
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={activeFilter}
                            onChange={e => {
                                setActiveFilter(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="all">All {filterOptions.label}s</option>
                            {filterOptions.options.map(opt => (
                                <option key={String(opt.value)} value={String(opt.value)}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col, idx) => (
                                <TableHead
                                    key={idx}
                                    className={col.sortable ? 'cursor-pointer select-none hover:bg-muted/50' : ''}
                                    onClick={() => col.sortable && handleSort(col.accessorKey as string)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.header}
                                        {col.sortable && sortKey === col.accessorKey && (
                                            <span className="text-xs">
                                                {sortDirection === 'asc' ? ' 🔼' : ' 🔽'}
                                            </span>
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item, rowIdx) => (
                                <TableRow
                                    key={rowIdx}
                                    className={onRowClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
                                    onClick={() => onRowClick && onRowClick(item)}
                                >
                                    {columns.map((col, colIdx) => (
                                        <TableCell key={colIdx}>
                                            {col.cell(item)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center h-24 text-muted-foreground">
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * pageSize + 1} to{' '}
                        {Math.min(currentPage * pageSize, filteredData.length)} of{' '}
                        {filteredData.length} entries
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(1)}
                        >
                            <ChevronsLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="px-3 text-sm font-medium">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
