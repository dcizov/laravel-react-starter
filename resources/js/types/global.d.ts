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
            auth: Auth;
            sidebarOpen: boolean;
            locale: string;
            translations: Record<string, string>;
            timezone: string;
            displayItems: string[];
            sidebarVariant: 'inset' | 'floating';
            locales: { value: string; label: string }[];
            font: 'instrument-sans' | 'inter' | 'manrope' | 'system';
            [key: string]: unknown;
        };
    }
}
