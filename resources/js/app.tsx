import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme, seedAppearance } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    /**
     * One persistent shell per area. Inertia keeps a layout mounted when the
     * resolved component is the same, so moving between admin screens no longer
     * remounts the sidebar or the top bar. Pages never render their own chrome;
     * the public site renders <ThemeShell> from its own page component.
     */
    layout: (name) => {
        switch (true) {
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            case name === 'dashboard':
            case name === 'demo':
            case name.startsWith('admin/'):
            case name.startsWith('posts/'):
                return AppLayout;
            default:
                return null;
        }
    },
    strictMode: true,
    withApp(app, { page }) {
        // The server's light/dark decision arrives in the shared props, so the
        // first client render matches the markup it is hydrating.
        const appearance = page.props.appearance;

        seedAppearance(appearance?.appearance, appearance?.resolved);

        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
