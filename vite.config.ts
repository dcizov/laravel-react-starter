import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig, lazyPlugins } from 'vite-plus';

export default defineConfig({
    plugins: lazyPlugins(() => [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react(),
        babel({
            presets: [reactCompilerPreset()],
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ]),
    // Pre-bundle the Base UI entry points at startup. Discovering them while the
    // dev server runs re-optimises the deps and breaks the chunk paths in the browser.
    optimizeDeps: {
        include: [
                '@base-ui/react',
                '@base-ui/react/alert-dialog',
                '@base-ui/react/avatar',
                '@base-ui/react/button',
                '@base-ui/react/checkbox',
                'motion/react',
                '@base-ui/react/collapsible',
                '@base-ui/react/dialog',
                '@base-ui/react/input',
                '@base-ui/react/menu',
                '@base-ui/react/merge-props',
                '@base-ui/react/navigation-menu',
                '@base-ui/react/popover',
                '@base-ui/react/progress',
                '@base-ui/react/radio',
                '@base-ui/react/radio-group',
                '@base-ui/react/select',
                '@base-ui/react/separator',
                '@base-ui/react/switch',
                '@base-ui/react/tabs',
                '@base-ui/react/toast',
                '@base-ui/react/toggle',
                '@base-ui/react/toggle-group',
                '@base-ui/react/tooltip',
                '@base-ui/react/use-render',
        ],
    },
    server: {
        watch: {
            ignored: [
                '**/.agents/**',
                '**/.claude/**',
                '**/.cursor/**',
                '**/.junie/**',
                '**/vendor/**',
            ],
        },
    },
    lint: {
        ignorePatterns: [
            'vendor/**',
            'node_modules/**',
            'public/**',
            'bootstrap/ssr/**',
            'tailwind.config.js',
            'resources/js/actions/**',
            'resources/js/components/ui/*',
            'resources/js/routes/**',
            'resources/js/wayfinder/**',
        ],
        options: {
            denyWarnings: true,
            typeAware: true,
        },
    },
    fmt: {
        printWidth: 80,
        tabWidth: 4,
        singleQuote: true,
        semi: true,
        singleAttributePerLine: false,
        htmlWhitespaceSensitivity: 'css',
        ignorePatterns: [
            '.github/**',
            'composer.json',
            'resources/js/components/ui/*',
            'resources/views/mail/*',
        ],
        sortTailwindcss: {
            functions: ['clsx', 'cn', 'cva'],
            stylesheet: 'resources/css/app.css',
        },
    },
});
