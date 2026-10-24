/**
 * Hydration parity for the appearance family.
 *
 * These are the components that once disagreed with their own server output:
 * the light/dark decision used to be read from `matchMedia` during render, so a
 * dark OS produced "Sun"/"Switch to light mode" in the browser over markup that
 * the server had rendered as "Moon"/"Switch to dark mode". Every case below
 * renders on the "server" (no `window`/`document`) and then hydrates the exact
 * same tree in jsdom, which is where React reports a mismatch.
 */
import { act } from 'react';
import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from '@/components/theme-toggle';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { seedAppearance } from '@/hooks/use-appearance';
import BlogIndex from '@/pages/blog/index';
import { blogProps } from './fixtures';

const pageState: { props: Record<string, unknown>; url: string } = {
    props: {},
    url: '/',
};

vi.mock('@inertiajs/react', async () => {
    const { createElement, Fragment } = await import('react');

    return {
        usePage: () => ({ props: pageState.props, url: pageState.url }),
        Head: () => null,
        // A faithful enough Link: `prefetch` is a prop, never an attribute.
        Link: ({ children, href }: { children?: unknown; href: string }) =>
            createElement(
                'a',
                { href },
                ...(Array.isArray(children) ? children : [children]).map(
                    (child) =>
                        // Fragment children keep the mock's props off the anchor.
                        createElement(Fragment, null, child as ReactElement),
                ),
            ),
        router: {
            get: () => {},
            post: () => {},
            patch: () => {},
            delete: () => {},
            on: () => () => {},
            reload: () => {},
        },
        useHttp: () => ({ patch: () => {}, processing: false }),
        Deferred: ({ children }: { children: ReactElement }) => children,
        WhenVisible: ({ children }: { children: ReactElement }) => children,
    };
});

const roots: { unmount: () => void }[] = [];

/** Render on the server (no DOM), then hydrate the identical tree in jsdom. */
async function ssrThenHydrate(
    element: () => ReactElement,
): Promise<{ messages: string[]; container: HTMLElement }> {
    const globalScope = globalThis as Record<string, unknown>;
    const saved = {
        window: globalScope.window,
        document: globalScope.document,
        navigator: globalScope.navigator,
    };

    let html: string;

    globalScope.window = undefined;
    globalScope.document = undefined;
    globalScope.navigator = undefined;

    try {
        html = renderToString(element());
    } finally {
        Object.assign(globalScope, saved);
    }

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    const messages: string[] = [];
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: unknown[]) =>
        messages.push(args.map(String).join(' '));
    console.warn = (...args: unknown[]) =>
        messages.push(args.map(String).join(' '));

    try {
        await act(async () => {
            roots.push(
                hydrateRoot(container, element(), {
                    onRecoverableError: (error) =>
                        messages.push(`[recoverable] ${String(error)}`),
                }),
            );
        });
    } finally {
        console.error = originalError;
        console.warn = originalWarn;
    }

    return { messages, container };
}

function setSystemPreference(dark: boolean): void {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: (query: string) => ({
            matches: query.includes('prefers-color-scheme') ? dark : false,
            media: query,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false,
        }),
    });
}

const wrap = (node: ReactElement) => (
    <TooltipProvider delayDuration={0}>{node}</TooltipProvider>
);

/** The page component with its server props; typed loosely so the fixture stays plain data. */
const Blog = BlogIndex as unknown as (
    props: Record<string, unknown>,
) => ReactElement;

describe('appearance hydration parity', () => {
    afterEach(() => {
        // Each root owns the appearance listener while it is mounted; leaving
        // one behind would let the next case inherit it.
        roots.splice(0).forEach((root) => act(() => root.unmount()));
    });

    beforeEach(() => {
        document.documentElement.className = '';
        document.documentElement.removeAttribute('data-appearance');
        document.documentElement.removeAttribute('data-appearance-resolved');
        pageState.props = blogProps as unknown as Record<string, unknown>;
        pageState.url = '/blog';
    });

    it.each([
        ['a dark OS', true],
        ['a light OS', false],
    ])(
        'theme toggle matches the server when the server resolved dark and the browser has %s',
        async (_label, darkOs) => {
            setSystemPreference(darkOs);
            seedAppearance('dark', 'dark');

            const { messages, container } = await ssrThenHydrate(() =>
                wrap(<ThemeToggle />),
            );

            expect(messages).toEqual([]);
            // The server's decision wins: no post-hydration flash of the other icon.
            expect(
                container.querySelector('[aria-label="Switch to light mode"]'),
            ).not.toBeNull();
        },
    );

    it('theme toggle matches the server for a system preference resolved to light', async () => {
        setSystemPreference(true);
        seedAppearance('system', 'light');

        const { messages, container } = await ssrThenHydrate(() =>
            wrap(<ThemeToggle />),
        );

        expect(messages).toEqual([]);
        // Only after hydration may the store reconcile `system` with the OS.
        expect(
            container.querySelector('[aria-label="Switch to light mode"]'),
        ).not.toBeNull();
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('the toaster does not resolve the theme on its own', async () => {
        setSystemPreference(true);
        seedAppearance('system', 'light');

        const { messages } = await ssrThenHydrate(() => wrap(<Toaster />));

        expect(messages).toEqual([]);
    });

    it('public pages hydrate cleanly while the OS preference disagrees with the server', async () => {
        setSystemPreference(true);
        seedAppearance('system', 'light');

        const { messages } = await ssrThenHydrate(() =>
            wrap(<Blog {...blogProps} />),
        );

        expect(messages).toEqual([]);
    });
});
