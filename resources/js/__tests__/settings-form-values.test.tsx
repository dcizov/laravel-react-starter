import { describe, expect, it } from 'vitest';

import { initial } from '@/pages/admin/settings/index';
import type { SettingsField } from '@/pages/admin/settings/index';

function field(overrides: Partial<SettingsField>): SettingsField {
    return {
        key: 'site_name',
        label: 'Site name',
        type: 'string',
        hint: null,
        required: false,
        options: [],
        value: null,
        has_value: null,
        preview: null,
        ...overrides,
    };
}

describe('settings form values', () => {
    it('starts a secret empty, even when the stored value would be shown', () => {
        expect(initial(field({ type: 'secret', value: 'hunter2' }))).toBe('');
    });

    it('starts an empty text field empty and an empty media field null', () => {
        expect(initial(field({ type: 'string', value: null }))).toBe('');
        expect(initial(field({ type: 'media', value: null }))).toBeNull();
    });

    it('keeps an integer as a number so the PATCH stays typed', () => {
        expect(initial(field({ type: 'integer', value: 42 }))).toBe(42);
    });

    it('passes a stored string through', () => {
        expect(initial(field({ value: 'Northwind Studio' }))).toBe(
            'Northwind Studio',
        );
    });

    it('degrades an unexpected structured value to an empty input', () => {
        // Regression: `String(value)` used to submit "[object Object]" for a
        // media setting whose value arrived as a reference object.
        expect(initial(field({ type: 'media', value: { id: 3 } }))).toBe('');
        expect(initial(field({ value: ['a', 'b'] }))).toBe('');
    });
});
