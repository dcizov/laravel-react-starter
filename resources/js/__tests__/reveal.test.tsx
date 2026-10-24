import { act, render } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Reveal } from '@/components/reveal';

/**
 * The reveal animation is CSS-only on purpose. These tests pin the two
 * properties that keep that safe: the markup is identical on both sides of
 * hydration, and the animation is not driven by a JavaScript media query.
 */
describe('Reveal', () => {
    it('stamps a deterministic class and delay on the server', () => {
        const markup = renderToString(
            <Reveal index={2}>
                <p>Section</p>
            </Reveal>,
        );

        expect(markup).toContain('class="reveal"');
        expect(markup).toContain('--reveal-delay:80ms');
        expect(markup).toContain('<p>Section</p>');
    });

    it('caps the stagger so late items do not lag behind', () => {
        const { container } = render(
            <Reveal index={12}>
                <p>Last</p>
            </Reveal>,
        );

        const element = container.firstElementChild as HTMLElement;

        expect(element.style.getPropertyValue('--reveal-delay')).toBe('240ms');
    });

    it('hydrates without a mismatch or a recoverable error', async () => {
        const element = (
            <Reveal index={1} as="section">
                <p>Hydrated</p>
            </Reveal>
        );

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
            html = renderToString(element);
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

        let root: ReturnType<typeof hydrateRoot> | undefined;

        try {
            await act(async () => {
                root = hydrateRoot(container, element, {
                    onRecoverableError: (error) =>
                        messages.push(`[recoverable] ${String(error)}`),
                });
            });
        } finally {
            console.error = originalError;
            console.warn = originalWarn;
        }

        expect(messages).toEqual([]);
        expect(container.textContent).toBe('Hydrated');

        act(() => root?.unmount());
        container.remove();
    });
});
