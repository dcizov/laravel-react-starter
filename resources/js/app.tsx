import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import { createInertiaApp } from '@inertiajs/react';
import type { ComponentType, ReactNode } from 'react';
import { AppToaster } from '@/components/app-toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Every page in resources/js/pages. vite.config.ts takes out the pages of features that are switched off, so
// their code is not in the bundle. Lazy, so each page is its own chunk, loaded on first visit.
const pages = import.meta.glob([
    './pages/**/*.tsx',
    '__FEATURE_PAGE_EXCLUDES__',
]);

// The outermost layout. It renders the toaster inside the Inertia page context, so
// toasts can use usePage (for translations) and survive page changes.
function WithToaster({ children }: { children: ReactNode }) {
    return (
        <TooltipProvider delay={0}>
            {children}
            <AppToaster />
        </TooltipProvider>
    );
}

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name) => {
        const load = pages[`./pages/${name}.tsx`];

        if (!load) {
            // A page of a disabled feature. The server does not send these while the feature is off.
            throw new Error(`Page not found: ${name}`);
        }

        const page = (await load()) as { default: ComponentType };

        return page.default;
    },
    layout: (name) => {
        switch (true) {
            // Public pages: the landing page, the newsletter sign-up, and the content and blog pages. No app shell.
            case name === 'welcome' ||
                name.startsWith('newsletter/') ||
                name.startsWith('content/') ||
                name.startsWith('blog/'):
                return WithToaster;
            case name.startsWith('auth/'):
                return [WithToaster, AuthLayout];
            case name.startsWith('settings/'):
                return [WithToaster, AppLayout, SettingsLayout];
            default:
                return [WithToaster, AppLayout];
        }
    },
    strictMode: true,
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
