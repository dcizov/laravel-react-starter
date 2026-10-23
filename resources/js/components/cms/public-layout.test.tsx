import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PublicLayout from '@/components/cms/public-layout';

// The addons the server reports as active, read by the mocked usePage below.
let mockAddons: string[] = [];

vi.mock('@/hooks/use-trans', () => ({
    useTrans: () => (text: string) => text,
}));

vi.mock('@/routes', () => ({
    dashboard: () => '/dashboard',
    login: () => '/login',
}));

// A plain anchor is enough to check the target of each link.
vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children }: { href: string; children: ReactNode }) => (
        <a href={href}>{children}</a>
    ),
    usePage: () => ({
        props: {
            name: 'Site',
            auth: { user: null },
            features: [],
            addons: mockAddons,
            site: { basePath: '', isDefault: true },
        },
    }),
}));

afterEach(() => {
    cleanup();
    mockAddons = [];
});

describe('PublicLayout newsletter link', () => {
    it('links to the sign-up page while the newsletter addon is active', () => {
        mockAddons = ['newsletter'];

        render(
            <PublicLayout>
                <p>content</p>
            </PublicLayout>,
        );

        expect(
            screen
                .getByRole('link', { name: 'Newsletter' })
                .getAttribute('href'),
        ).toBe('/newsletter');
    });

    it('renders no newsletter link when the addon is inactive', () => {
        mockAddons = [];

        render(
            <PublicLayout>
                <p>content</p>
            </PublicLayout>,
        );

        expect(screen.queryByRole('link', { name: 'Newsletter' })).toBeNull();
        expect(
            screen.getByRole('link', { name: 'Log in' }).getAttribute('href'),
        ).toBe('/login');
    });
});
