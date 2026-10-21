import type { Auth } from '@/types/auth';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            // The admin's logo, or null to show the default mark.
            appLogoUrl: string | null;
            auth: Auth;
            sidebarOpen: boolean;
            locale: string;
            translations: Record<string, string>;
            timezone: string;
            displayItems: string[];
            // Whether the public landing page is on. The visual editor is only shown when it is.
            landingEnabled: boolean;
            // Set while an administrator is signed in as this user.
            impersonating: { name: string } | null;
            sidebarVariant: 'inset' | 'floating';
            locales: { value: string; label: string }[];
            font: 'instrument-sans' | 'inter' | 'manrope' | 'system';
            [key: string]: unknown;
        };
    }
}
