import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import { createInertiaApp } from '@inertiajs/react';
import {
    lazy,
    Suspense
    
    
    
} from 'react';
import type {ComponentProps, ComponentType, ReactNode} from 'react';
import { AppToaster } from '@/components/app-toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Every page in resources/js/pages, and every page of an addon in addons/<slug>/resources/js/pages. The addon
// glob is fixed and literal, so the build sees it. Addon pages are named "<slug>::<page>" on the server. vite.config.ts
// takes out the pages of features that are switched off, so their code is not in the bundle. Lazy, so each page is
// its own chunk, loaded on first visit.
const pages = import.meta.glob([
    './pages/**/*.tsx',
    '../../addons/*/resources/js/pages/**/*.tsx',
    '__FEATURE_PAGE_EXCLUDES__',
]);

// The addon pages that are public, with no app shell. Every other addon page uses the admin shell.
const PUBLIC_ADDON_PAGES = new Set([
    'newsletter::subscribe',
    'newsletter::unsubscribed',
]);

/** The page file for a page name: "dashboard", or "newsletter::subscribe" for an addon page. */
function pageLoader(name: string) {
    const [addon, page] = name.split('::');

    if (page === undefined) {
        return pages[`./pages/${name}.tsx`];
    }

    return pages[`../../addons/${addon}/resources/js/pages/${page}.tsx`];
}

// The admin shell (sidebar, site switcher, navigation) is only used by the admin and app pages. Loading it lazily
// keeps it out of the public pages, which otherwise download every icon and menu the shell imports.
const AppLayoutShell = lazy(() => import('@/layouts/app-layout'));

function AppLayout(props: ComponentProps<typeof AppLayoutShell>) {
    return (
        <Suspense fallback={null}>
            <AppLayoutShell {...props} />
        </Suspense>
    );
}

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
        const load = pageLoader(name);

        if (!load) {
            // A page of a disabled feature or an inactive addon. The server does not send these while it is off.
            throw new Error(`Page not found: ${name}`);
        }

        const page = (await load()) as { default: ComponentType };

        return page.default;
    },
    layout: (name) => {
        switch (true) {
            // Public pages: the landing page, the newsletter sign-up, and the content and blog pages. No app shell.
            case name === 'welcome' ||
                PUBLIC_ADDON_PAGES.has(name) ||
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
