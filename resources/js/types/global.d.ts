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
            // The features switched on for this installation (see config/features.php), by slug.
            features: string[];
            // Set while an administrator is signed in as this user.
            impersonating: { name: string } | null;
            sidebarVariant: 'inset' | 'floating';
            locales: { value: string; label: string }[];
            font: 'instrument-sans' | 'inter' | 'manrope' | 'system';
            [key: string]: unknown;
        };
    }
}
