import { describe, expect, it } from 'vitest';
import { readingMinutes } from '@/lib/reading-time';
import type { ContentBlock } from '@/types/cms';

const paragraph = (text: string): ContentBlock => ({
    id: 'p',
    type: 'paragraph',
    data: { text },
});

describe('readingMinutes', () => {
    it('is at least one minute, even for an empty post', () => {
        expect(readingMinutes([])).toBe(1);
        expect(readingMinutes([paragraph('Kurz.')])).toBe(1);
    });

    it('counts about 1,000 characters a minute', () => {
        expect(readingMinutes([paragraph('a'.repeat(2400))])).toBe(2);
        expect(readingMinutes([paragraph('a'.repeat(4600))])).toBe(5);
    });

    it('counts list items and headings too, and ignores dividers', () => {
        const body: ContentBlock[] = [
            {
                id: 'h',
                type: 'heading',
                data: { level: 2, text: 'b'.repeat(500) },
            },
            {
                id: 'l',
                type: 'list',
                data: { ordered: false, items: ['c'.repeat(1600)] },
            },
            { id: 'd', type: 'divider', data: {} },
        ];

        expect(readingMinutes(body)).toBe(2);
    });
});
