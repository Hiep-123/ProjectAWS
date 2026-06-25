/**
 * Custom Hooks
 * Reusable React hooks for common functionality
 */

import { useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Hook for managing local state with localStorage sync
 */
export const useLocalStorage = <T,>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.error(`Error reading from localStorage key "${key}":`, error)
            return initialValue
        }
    })

    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value
                setStoredValue(valueToStore)
                window.localStorage.setItem(key, JSON.stringify(valueToStore))
            } catch (error) {
                console.error(`Error writing to localStorage key "${key}":`, error)
            }
        },
        [key, storedValue]
    )

    return [storedValue, setValue] as const
}

/**
 * Hook for managing form state
 */
export const useForm = <T extends Record<string, unknown>>(initialValues: T) => {
    const [values, setValues] = useState(initialValues)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [touched, setTouched] = useState<Record<string, boolean>>({})

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const { name, value, type } = e.target
            const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

            setValues(prev => ({
                ...prev,
                [name]: finalValue,
            }))

            // Clear error when user starts typing
            if (errors[name]) {
                setErrors(prev => ({
                    ...prev,
                    [name]: '',
                }))
            }
        },
        [errors]
    )

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name } = e.target
        setTouched(prev => ({
            ...prev,
            [name]: true,
        }))
    }, [])

    const setFieldError = useCallback((field: string, error: string) => {
        setErrors(prev => ({
            ...prev,
            [field]: error,
        }))
    }, [])

    const resetForm = useCallback(() => {
        setValues(initialValues)
        setErrors({})
        setTouched({})
    }, [initialValues])

    return {
        values,
        errors,
        touched,
        setValues,
        handleChange,
        handleBlur,
        setFieldError,
        resetForm,
    }
}

/**
 * Hook for handling pagination
 */
export const usePagination = (totalItems: number, itemsPerPage: number = 10) => {
    const [currentPage, setCurrentPage] = useState(1)

    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const goToPage = useCallback(
        (page: number) => {
            const pageNumber = Math.max(1, Math.min(page, totalPages))
            setCurrentPage(pageNumber)
        },
        [totalPages]
    )

    const goToNextPage = useCallback(() => {
        goToPage(currentPage + 1)
    }, [currentPage, goToPage])

    const goToPreviousPage = useCallback(() => {
        goToPage(currentPage - 1)
    }, [currentPage, goToPage])

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage

    return {
        currentPage,
        totalPages,
        goToPage,
        goToNextPage,
        goToPreviousPage,
        startIndex,
        endIndex,
    }
}

/**
 * Hook for handling debounced search
 */
export const useDebouncedSearch = (initialValue: string = '', delay: number = 500) => {
    const [searchTerm, setSearchTerm] = useState(initialValue)
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, delay)

        return () => clearTimeout(timer)
    }, [searchTerm, delay])

    return {
        searchTerm,
        setSearchTerm,
        debouncedSearchTerm,
    }
}

/**
 * Hook for detecting mobile device
 */
export const useIsMobile = (breakpoint: number = 768) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint)

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < breakpoint)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [breakpoint])

    return isMobile
}

/**
 * Hook for scroll position
 */
export const useScrollPosition = () => {
    const [scrollPosition, setScrollPosition] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            setScrollPosition(window.scrollY)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return scrollPosition
}

/**
 * Hook to check if user has scrolled past a threshold
 */
export const useScrollThreshold = (threshold: number = 100) => {
    const scrollPosition = useScrollPosition()
    return scrollPosition > threshold
}

/**
 * Hook for managing previous value
 */
export const usePrevious = <T,>(value: T) => {
    const [previous, setPrevious] = useState<T>()

    useEffect(() => {
        setPrevious(value)
    }, [value])

    return previous
}

/**
 * Hook to scroll to top on route change
 */
export const useScrollToTop = () => {
    const { pathname } = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])
}

/**
 * Hook for async operation management
 */
export const useAsync = <T, E = string>(
    asyncFunction: () => Promise<T>,
    immediate: boolean = true
) => {
    const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
    const [value, setValue] = useState<T | null>(null)
    const [error, setError] = useState<E | null>(null)

    const execute = useCallback(async () => {
        setStatus('pending')
        setValue(null)
        setError(null)
        try {
            const response = await asyncFunction()
            setValue(response)
            setStatus('success')
            return response
        } catch (err) {
            setError(err as E)
            setStatus('error')
        }
    }, [asyncFunction])

    useEffect(() => {
        if (immediate) {
            execute()
        }
    }, [execute, immediate])

    return { execute, status, value, error }
}
