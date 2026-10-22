import { cleanup, render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    SiteOverviewCards,
    SiteOverviewSkeleton,
} from '@/components/dashboard/site-overview';
import type { SiteOverview } from '@/components/dashboard/site-overview';

// Replace :placeholders the way the real hook does, and keep the English text otherwise.
vi.mock('@/hooks/use-trans', () => ({
    useTrans:
        () => (text: string, replace?: Record<string, string | number>) => {
            let out = text;

            for (const [name, value] of Object.entries(replace ?? {})) {
                out = out.replace(`:${name}`, String(value));
            }

            return out;
        },
}));

// A plain anchor is enough to check the target of each link.
vi.mock('@inertiajs/react', () => ({
    Link: ({
        href,
        children,
        ...props
    }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

const content = {
    types: [
        { key: 'page', label: 'Pages', singularLabel: 'Page' },
        { key: 'post', label: 'Posts', singularLabel: 'Post' },
    ],
    published: 4,
    drafts: 2,
    scheduled: 1,
    trashed: 0,
    canCreate: true,
};

function overview(extra: Partial<SiteOverview> = {}): SiteOverview {
    return { site: { name: 'Main', isDefault: true }, ...extra };
}

describe('SiteOverviewCards', () => {
    afterEach(() => {
        cleanup();
    });

    it('shows only the cards the server sent', () => {
        render(
            <SiteOverviewCards
                overview={overview({ content, comments: { pending: 3 } })}
            />,
        );

        expect(screen.getByText('Content')).toBeTruthy();
        expect(screen.getByText('Comments')).toBeTruthy();
        expect(screen.queryByText('Newsletter')).toBeNull();
        expect(screen.queryByText('Search and sharing')).toBeNull();
        expect(screen.queryByText('Sites')).toBeNull();
    });

    it('shows the empty state when the user may see no card', () => {
        render(<SiteOverviewCards overview={overview()} />);

        expect(screen.getByText('Nothing to show yet')).toBeTruthy();
    });

    it('links the content card to every content type', () => {
        render(<SiteOverviewCards overview={overview({ content })} />);

        expect(
            screen.getByRole('link', { name: 'Pages' }).getAttribute('href'),
        ).toBe('/admin/content/page');
        expect(
            screen.getByRole('link', { name: 'Posts' }).getAttribute('href'),
        ).toBe('/admin/content/post');
    });

    it('shows the create link on an empty content card', () => {
        render(
            <SiteOverviewCards
                overview={overview({
                    content: {
                        ...content,
                        published: 0,
                        drafts: 0,
                        scheduled: 0,
                    },
                })}
            />,
        );

        expect(screen.getByText('No content yet.')).toBeTruthy();
        expect(
            screen.getByRole('link', { name: 'New Page' }).getAttribute('href'),
        ).toBe('/admin/content/page/create');
    });

    it('hides the create link when the user may not create content', () => {
        render(
            <SiteOverviewCards
                overview={overview({
                    content: {
                        ...content,
                        published: 0,
                        drafts: 0,
                        scheduled: 0,
                        canCreate: false,
                    },
                })}
            />,
        );

        expect(screen.getByText('No content yet.')).toBeTruthy();
        expect(screen.queryByRole('link', { name: 'New Page' })).toBeNull();
    });

    it('tells the admin how many live pages lack a search description', () => {
        render(
            <SiteOverviewCards
                overview={overview({
                    seo: { indexing: false, withoutDescription: 2 },
                })}
            />,
        );

        expect(
            screen.getByText('Search engines are asked to stay away.'),
        ).toBeTruthy();
        expect(
            screen.getByText('2 live pages have no search description.'),
        ).toBeTruthy();
        expect(screen.getByText('Indexing off')).toBeTruthy();
    });

    it('shows the pending comment count and links to the moderation page', () => {
        render(
            <SiteOverviewCards
                overview={overview({ comments: { pending: 5 } })}
            />,
        );

        expect(screen.getByText('5')).toBeTruthy();
        expect(
            screen
                .getByRole('link', { name: 'Review comments' })
                .getAttribute('href'),
        ).toBe('/admin/blog/comments?status=pending');
    });

    it('shows the site count and the default site name', () => {
        render(
            <SiteOverviewCards
                overview={overview({ sites: { count: 3, default: 'Main' } })}
            />,
        );

        expect(screen.getByText('Default: Main')).toBeTruthy();
        expect(
            screen
                .getByRole('link', { name: 'Manage sites' })
                .getAttribute('href'),
        ).toBe('/admin/sites');
    });
});

describe('SiteOverviewSkeleton', () => {
    afterEach(() => {
        cleanup();
    });

    it('announces the loading state to screen readers', () => {
        render(<SiteOverviewSkeleton />);

        expect(screen.getByRole('status').textContent).toContain(
            'Loading the site overview…',
        );
    });
});
