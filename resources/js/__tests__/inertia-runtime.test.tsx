/**
 * End-to-end(ish) runtime check: the real `@inertiajs/react` <App> is rendered
 * to a string the way the SSR server does it, hydrated into jsdom exactly like
 * the browser does it, and then driven through a client visit.
 *
 * Two classes of regression are covered here:
 *  - hydration: React reports any server/client divergence as a recoverable
 *    error or a console.error while hydrating;
 *  - flushSync: Inertia swaps the page with `flushSync` from a `useEffect`, and
 *    React rejects that when a visit is pending before the app has mounted. A
 *    clean mount + visit must produce no such warning.
 */
import { App, router } from '@inertiajs/react';
import { StrictMode, act } from 'react';
import type { ComponentType, ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { seedAppearance } from '@/hooks/use-appearance';
import BlogIndex from '@/pages/blog/index';
import BlogShow from '@/pages/blog/show';
import AperturePage from '@/pages/themes/aperture/page';
import {
    blogProps,
    blogShowProps,
    sharedProps,
    themePageProps,
} from './fixtures';

/**
 * The four URLs from the report, each with the props its controller sends.
 */
const routes = [
    {
        name: '/',
        component: 'themes/aperture/page',
        url: '/',
        props: themePageProps,
        Component: AperturePage,
    },
    {
        name: '/blog',
        component: 'blog/index',
        url: '/blog',
        props: blogProps,
        Component: BlogIndex,
    },
    {
        name: '/blog/why-we-still-draw-with-a-pencil',
        component: 'blog/show',
        url: '/blog/why-we-still-draw-with-a-pencil',
        props: blogShowProps,
        Component: BlogShow,
    },
] as const;

const pageFor = (route: (typeof routes)[number]) => ({
    component: route.component,
    url: route.url,
    version: 'test',
    props: { ...sharedProps, ...route.props },
});

type Page = ReturnType<typeof pageFor>;

/**
 * The Inertia router is a singleton and binds `resolveComponent` once, when the
 * first root mounts, so resolution is by component name — exactly like
 * `resolvePageComponent` in the real client.
 */
const components = new Map<string, ComponentType<never>>(
    routes.map((route) => [
        route.component,
        route.Component as unknown as ComponentType<never>,
    ]),
);

const resolveComponent = (name: string): Promise<ComponentType<never>> => {
    const resolved = components.get(name);

    if (!resolved) {
        return Promise.reject(new Error(`Unknown page component: ${name}`));
    }

    return Promise.resolve(resolved);
};

function tree(page: Page, component: ComponentType<never>): ReactElement {
    const appearance = page.props.appearance as {
        appearance: 'light' | 'dark' | 'system';
        resolved: 'light' | 'dark';
    };

    // What `withApp` does in resources/js/app.tsx, before either render.
    seedAppearance(appearance.appearance, appearance.resolved);

    return (
        <StrictMode>
            <TooltipProvider delayDuration={0}>
                <App
                    initialPage={page as never}
                    initialComponent={component as never}
                    resolveComponent={resolveComponent as never}
                    titleCallback={(title: string) => title}
                    defaultLayout={() => null}
                />
                <Toaster />
            </TooltipProvider>
        </StrictMode>
    );
}

/** The same document body `buildSSRBody` produces on the server. */
function ssrBody(page: Page, component: ComponentType<never>): string {
    const globalScope = globalThis as Record<string, unknown>;
    const saved = {
        window: globalScope.window,
        document: globalScope.document,
        navigator: globalScope.navigator,
    };

    globalScope.window = undefined;
    globalScope.document = undefined;
    globalScope.navigator = undefined;

    let html: string;

    try {
        html = renderToString(tree(page, component));
    } finally {
        Object.assign(globalScope, saved);
    }

    const json = JSON.stringify(page)
        .replace(/\//g, '\\/')
        .replace(/</g, '\\u003c');

    return `<script data-page="app" type="application/json">${json}</script><div data-server-rendered="true" id="app">${html}</div>`;
}

/** A minimal XMLHttpRequest that answers with an Inertia page document. */
function installXhr(response: () => Record<string, unknown>): void {
    class FakeXhr {
        status = 200;
        responseText = '';
        upload = { onprogress: null };
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        onabort: (() => void) | null = null;

        open(): void {}
        setRequestHeader(): void {}
        abort(): void {}
        getAllResponseHeaders(): string {
            // Inertia treats a response without `X-Inertia` as a plain document
            // and tries to open it in a modal.
            return 'content-type: application/json\r\nx-inertia: true';
        }
        getResponseHeader(name: string): string | null {
            const headers: Record<string, string> = {
                'content-type': 'application/json',
                'x-inertia': 'true',
            };

            return headers[name.toLowerCase()] ?? null;
        }
        send(): void {
            this.responseText = JSON.stringify(response());
            setTimeout(() => this.onload?.(), 0);
        }
    }

    (window as unknown as Record<string, unknown>).XMLHttpRequest = FakeXhr;
}

function captureConsole() {
    const messages: string[] = [];
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: unknown[]) =>
        messages.push(args.map(String).join(' '));
    console.warn = (...args: unknown[]) =>
        messages.push(args.map(String).join(' '));

    return {
        messages,
        restore: () => {
            console.error = originalError;
            console.warn = originalWarn;
        },
    };
}

const roots: { unmount: () => void }[] = [];

/** Mutable so `mount` can report into whichever test is running. */
let captured: { messages: string[]; restore: () => void } = {
    messages: [],
    restore: () => {},
};

function mount(page: Page, component: ComponentType<never>): void {
    roots.push(
        hydrateRoot(document.getElementById('app')!, tree(page, component), {
            onRecoverableError: (error) =>
                captured.messages.push(`[recoverable] ${String(error)}`),
        }),
    );
}

describe.each(routes)('inertia runtime $name', (route) => {
    const { Component } = route;
    const page = pageFor(route);
    const component = Component as unknown as ComponentType<never>;

    beforeEach(() => {
        captured = captureConsole();
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            writable: true,
            value: (query: string) => ({
                matches: query.includes('prefers-color-scheme'),
                media: query,
                onchange: null,
                addEventListener: () => {},
                removeEventListener: () => {},
                addListener: () => {},
                removeListener: () => {},
                dispatchEvent: () => false,
            }),
        });
        window.history.replaceState({}, '', route.url);
        // Inertia restores scroll after a swap; jsdom has no implementation.
        Object.defineProperty(window, 'scrollTo', {
            configurable: true,
            writable: true,
            value: () => {},
        });
        document.body.innerHTML = ssrBody(page, component);
        installXhr(() => ({ ...page, url: `${route.url}?page=2` }));
    });

    afterEach(() => {
        // The Inertia router is a module singleton: a root left mounted would
        // keep reacting to the next case's visits.
        roots.splice(0).forEach((root) => act(() => root.unmount()));
        document.body.innerHTML = '';
        window.history.replaceState({}, '', '/');
        captured.restore();
    });

    it('hydrates the server body without reporting a mismatch', async () => {
        await act(async () => {
            mount(page, component);
        });

        expect(captured.messages).toEqual([]);
    });

    it('performs a client visit without a flushSync warning', async () => {
        await act(async () => {
            mount(page, component);
        });

        await act(async () => {
            router.visit(`${route.url}?page=2`);
            await new Promise((resolve) => setTimeout(resolve, 30));
        });

        expect(captured.messages).toEqual([]);
    });
});
