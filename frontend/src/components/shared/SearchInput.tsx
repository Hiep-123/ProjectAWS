import React, { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn, debounce } from '@lib/utils'

interface SearchInputProps {
    value?: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    debounceMs?: number
    autoFocus?: boolean
    onClear?: () => void
}

const SearchInput: React.FC<SearchInputProps> = ({
    value = '',
    onChange,
    placeholder = 'Search...',
    className,
    debounceMs = 300,
    autoFocus = false,
    onClear,
}) => {
    const [localValue, setLocalValue] = useState(value)
    const inputRef = useRef<HTMLInputElement>(null)

    const debouncedOnChange = useRef(debounce(onChange, debounceMs)).current

    useEffect(() => {
        setLocalValue(value)
    }, [value])

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus()
        }
    }, [autoFocus])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setLocalValue(val)
        debouncedOnChange(val)
    }

    const handleClear = () => {
        setLocalValue('')
        onChange('')
        onClear?.()
        inputRef.current?.focus()
    }

    return (
        <div className={cn('relative flex items-center', className)}>
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
                ref={inputRef}
                type="search"
                value={localValue}
                onChange={handleChange}
                placeholder={placeholder}
                className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-9 py-2 text-sm',
                    'ring-offset-background placeholder:text-muted-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    '[&::-webkit-search-cancel-button]:hidden'
                )}
            />
            {localValue && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}

export default SearchInput
