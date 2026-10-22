import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { loadEnv } from 'vite';
import type { Plugin } from 'vite';
import { defineConfig, lazyPlugins } from 'vite-plus';

// The default matches config/features.php.
const DEFAULT_FEATURES = 'landing,integrations';

// The page files of each feature, relative to resources/js. Pages of a feature that is switched off are left
// out of the bundle. Keep this in step with the feature folders under app/Features.
const FEATURE_PAGES: Record<string, string[]> = {
    landing: ['./pages/welcome.tsx', './pages/admin/landing.tsx'],
    integrations: ['./pages/admin/integrations/**'],
    // The cms feature also owns the moderation page for comments, which is under admin/blog.
    cms: [
        './pages/admin/content/**',
        './pages/admin/cms/**',
        './pages/admin/blog/**',
        './pages/content/**',
    ],
    blog: ['./pages/blog/**'],
    seo: ['./pages/admin/seo/**'],
};

// Placeholder in app.tsx, replaced at build time by the exclusions for disabled features.
const EXCLUDES_PLACEHOLDER = '__FEATURE_PAGE_EXCLUDES__';

// Removes the pages of disabled features from the page glob in app.tsx, so their code is not bundled.
// FEATURES is read at build (or dev server) start, so run "npm run build" after changing it.
function featurePages(features: string[]): Plugin {
    const excludes = Object.entries(FEATURE_PAGES)
        .filter(([feature]) => !features.includes(feature))
        .flatMap(([, patterns]) => patterns.map((pattern) => `'!${pattern}'`))
        .join(', ');

    return {
        name: 'feature-pages',
        enforce: 'pre',
        transform(code, id) {
            if (!id.replace(/\\/g, '/').endsWith('/resources/js/app.tsx')) {
                return null;
            }

            return code.replace(`'${EXCLUDES_PLACEHOLDER}'`, excludes);
        },
    };
}

const env = loadEnv('production', process.cwd(), '');
const enabledFeatures = (
    process.env.FEATURES ??
    env.FEATURES ??
    DEFAULT_FEATURES
)
    .split(',')
    .map((feature) => feature.trim())
    .filter(Boolean);

export default defineConfig({
    plugins: lazyPlugins(() => [
        featurePages(enabledFeatures),
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
    // Browser-like tests for the components under resources/js. Run with "npm run test:js".
    test: {
        environment: 'jsdom',
        include: ['resources/js/**/*.test.{ts,tsx}'],
    },
    // Pre-bundle the Base UI entry points at startup. Discovering them while the
    // dev server runs re-optimises the deps and breaks the chunk paths in the browser.
    // Pre-bundle the dependencies used by the pages at startup. Vite finds some of them only when a page
    // loads, which re-optimises the deps during the session and breaks the chunk paths in the browser.
    optimizeDeps: {
        include: [
            '@base-ui/react/alert-dialog',
            '@base-ui/react/avatar',
            '@base-ui/react/button',
            '@base-ui/react/checkbox',
            '@base-ui/react/dialog',
            '@base-ui/react/drawer',
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
            '@base-ui/react/tooltip',
            '@base-ui/react/use-render',
            '@base-ui/react',
            '@dnd-kit/core',
            '@dnd-kit/modifiers',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
            '@tanstack/react-table',
            'cmdk',
            'input-otp',
            'motion/react',
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
