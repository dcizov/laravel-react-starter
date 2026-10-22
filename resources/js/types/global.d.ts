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
            // The slugs of the addons that are active right now (see config/addons.php).
            addons: string[];
            // Set while an administrator is signed in as this user.
            impersonating: { name: string } | null;
            sidebarVariant: 'inset' | 'floating';
            locales: { value: string; label: string }[];
            font: 'instrument-sans' | 'inter' | 'manrope' | 'system';
            // The site this request works on. basePath is /s/{slug} for a site reached by path, otherwise empty.
            site: {
                id: number;
                name: string;
                slug: string;
                locale: string;
                isDefault: boolean;
                basePath: string;
                mode: 'default' | 'domain' | 'path' | 'admin';
            };
            // Every site, for the admin's site switcher. Null outside the admin pages.
            sites:
                | {
                      id: number;
                      name: string;
                      slug: string;
                      domain: string | null;
                      isDefault: boolean;
                  }[]
                | null;
            [key: string]: unknown;
        };
    }
}
