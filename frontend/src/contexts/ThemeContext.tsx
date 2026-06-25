/**
 * Theme Context
 * Dark/Light mode state management using Context API
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { LOCAL_STORAGE_KEYS } from '@lib'

type Theme = 'light' | 'dark'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>('light')

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const initializeTheme = () => {
            const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) as Theme | null

            if (savedTheme) {
                setThemeState(savedTheme)
                applyTheme(savedTheme)
                return
            }

            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            const initialTheme: Theme = prefersDark ? 'dark' : 'light'
            setThemeState(initialTheme)
            applyTheme(initialTheme)
        }

        initializeTheme()
    }, [])

    const applyTheme = useCallback((t: Theme) => {
        if (t === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [])

    const toggleTheme = useCallback(() => {
        setThemeState(prevTheme => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light'
            localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, newTheme)
            applyTheme(newTheme)
            return newTheme
        })
    }, [applyTheme])

    const setTheme = useCallback(
        (t: Theme) => {
            localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, t)
            applyTheme(t)
            setThemeState(t)
        },
        [applyTheme]
    )

    const value: ThemeContextType = {
        theme,
        toggleTheme,
        setTheme,
    }

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Hook to use theme context
 */
export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}
