import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Component tests run in jsdom against the source, not the built bundle, so a
 * failure points at the component rather than at Vite. The `@` alias mirrors
 * tsconfig.json; nothing else from vite.config.ts is needed here (Laravel's
 * plugin and Wayfinder exist to produce assets, not to run tests).
 */
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./resources/js/__tests__/setup.ts'],
        include: ['resources/js/**/*.test.{ts,tsx}'],
    },
});
