import { describe, expect, it } from 'vitest';
import { safeHref } from '@/lib/url';

describe('safeHref', () => {
    it.each([
        ['https://example.com/docs', 'https://example.com/docs'],
        ['/blog/lattice-1-0', '/blog/lattice-1-0'],
        ['#pricing', '#pricing'],
        ['?page=2', '?page=2'],
    ])('keeps %s', (input, expected) => {
        expect(safeHref(input)).toBe(expected);
    });

    it.each([
        ['javascript:alert(1)'],
        ['JavaScript:alert(1)'],
        ['data:text/html;base64,PHNjcmlwdD4='],
        ['vbscript:msgbox'],
        ['java\nscript:alert(1)'],
        ['https://example.com/ with a space'],
        [''],
        [null],
        [undefined],
    ])('refuses %s', (input) => {
        expect(safeHref(input)).toBeNull();
    });
});
