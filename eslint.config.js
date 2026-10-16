import js from '@eslint/js';
import react from '@eslint-react/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import prettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import-x';
import typescript from 'typescript-eslint';

export default [
    js.configs.recommended,
    ...typescript.configs.recommended,
    react.configs['recommended-typescript'],
    {
        plugins: {
            'import-x': importPlugin,
        },
        settings: {
            'import-x/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json',
                },
                node: true,
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports',
                },
            ],
            'import-x/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index',
                    ],
                    pathGroups: [
                        { pattern: '@/actions/**', group: 'internal' },
                        { pattern: '@/routes/**', group: 'internal' },
                    ],
                    pathGroupsExcludedImportTypes: ['type'],
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                },
            ],
            'import-x/consistent-type-specifier-style': [
                'error',
                'prefer-top-level',
            ],
        },
    },
    {
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            '@stylistic/brace-style': [
                'error',
                '1tbs',
                { allowSingleLine: false },
            ],
        },
    },
    {
        ignores: [
            'vendor',
            'node_modules',
            'public',
            'bootstrap/ssr',
            'resources/js/actions/**',
            'resources/js/components/ui/**',
            'resources/js/routes/**',
            'resources/js/wayfinder/**',
        ],
    },
    prettier,
];
