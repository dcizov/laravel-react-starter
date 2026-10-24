import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * jsdom implements no `matchMedia`, but several components read it — some at
 * module scope (the sidebar asks once for its mobile breakpoint). Without a
 * stand-in those modules throw on import. Tests that care about a preference
 * override it per case; the default is "no match", i.e. desktop and light.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: (query: string): MediaQueryList =>
            ({
                matches: false,
                media: query,
                onchange: null,
                addEventListener: () => {},
                removeEventListener: () => {},
                addListener: () => {},
                removeListener: () => {},
                dispatchEvent: () => false,
            }) as unknown as MediaQueryList,
    });
}

afterEach(() => {
    cleanup();
});
