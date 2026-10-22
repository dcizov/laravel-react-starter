import { usePage } from '@inertiajs/react';

/**
 * The path in front of every public link of the current site: /s/{slug} for a site reached by path, and an
 * empty string for the default site or a site with its own domain. Use it for any link built in the browser.
 */
export function useSiteBase(): string {
    return usePage().props.site.basePath;
}
