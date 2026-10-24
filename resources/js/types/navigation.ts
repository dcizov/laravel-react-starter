import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
};

/**
 * Navigation comes from the server registry (core config + addon manifests).
 * Icons arrive as kebab-case names and are mapped to components client-side.
 */
export type NavigationItem = {
    label: string;
    href: string;
    route: string;
    icon: string | null;
    permission: string | null;
    addon: string | null;
};

export type NavigationSection = {
    label: string;
    items: NavigationItem[];
};
