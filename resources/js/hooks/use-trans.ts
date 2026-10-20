import { usePage } from '@inertiajs/react';
import { useCallback } from 'react';

/**
 * Translate a UI string using the app's language.
 *
 * The keys are the English strings themselves, the same as Laravel's JSON
 * translations in lang/{locale}.json. Missing keys fall back to the English text.
 * Placeholders use Laravel's `:name` syntax.
 */
export function useTrans() {
    const { translations } = usePage().props;

    return useCallback(
        (key: string, replace?: Record<string, string | number>): string => {
            let text = translations[key] ?? key;

            for (const [name, value] of Object.entries(replace ?? {})) {
                text = text.replace(`:${name}`, String(value));
            }

            return text;
        },
        [translations],
    );
}
