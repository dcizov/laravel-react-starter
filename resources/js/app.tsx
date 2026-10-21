import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import { createInertiaApp } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AppToaster } from '@/components/app-toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

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
    layout: (name) => {
        switch (true) {
            // Public pages: the landing page and the newsletter sign-up. No app shell.
            case name === 'welcome' || name.startsWith('newsletter/'):
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
