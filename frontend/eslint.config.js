import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
    // ── Ignored paths ──────────────────────────────────────────────────────
    {
        ignores: ['dist', 'node_modules'],
    },

    // ── TypeScript + React files ───────────────────────────────────────────
    {
        files: ['**/*.{ts,tsx}'],

        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
        },

        settings: {
            react: { version: '19.0' },
        },

        plugins: {
            '@typescript-eslint': tsPlugin,
            'react-refresh': reactRefresh,
            'react-hooks': reactHooks,
        },

        rules: {
            // TypeScript recommended rules (errors)
            ...tsPlugin.configs['recommended'].rules,

            // Downgrade noisy TS rules to warnings so existing code stays green
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],

            // React rules
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
        },
    },

    // ── Plain JS files ─────────────────────────────────────────────────────
    {
        files: ['**/*.{js,mjs,cjs}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
    },
]
