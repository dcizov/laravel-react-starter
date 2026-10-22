import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BackToTop } from '@/components/landing/back-to-top';

vi.mock('@/hooks/use-trans', () => ({
    useTrans: () => (text: string) => text,
}));

// Compare whole class names: the button also has "disabled:pointer-events-none", which contains the same text.
function classes(element: HTMLElement): string[] {
    return element.className.split(/\s+/);
}

function setScrollY(value: number) {
    Object.defineProperty(window, 'scrollY', {
        value,
        writable: true,
        configurable: true,
    });
}

describe('BackToTop', () => {
    afterEach(() => {
        cleanup();
        setScrollY(0);
    });

    it('is hidden at the top of the page and shown after scrolling down', () => {
        setScrollY(0);
        render(<BackToTop />);

        const button = screen.getByRole('button', { name: 'Back to top' });
        expect(classes(button)).toContain('pointer-events-none');
        expect(classes(button)).toContain('opacity-0');

        act(() => {
            setScrollY(800);
            fireEvent.scroll(window);
        });

        expect(classes(button)).toContain('opacity-100');
        expect(classes(button)).not.toContain('pointer-events-none');
    });

    it('starts visible when the page is already scrolled down', () => {
        setScrollY(1200);
        render(<BackToTop />);

        expect(
            classes(screen.getByRole('button', { name: 'Back to top' })),
        ).toContain('opacity-100');
    });
});
