import { appAddonPages } from '@/generated/app-addon-pages';
import { publicAddonPages } from '@/generated/public-addon-pages';

export type AddonPageLoader = () => Promise<unknown>;

/** The addon slug in a page name such as "newsletter::subscribe", or null for a core page. */
export function addonSlugOf(name: string): string | null {
    const separator = name.indexOf('::');

    return separator === -1 ? null : name.slice(0, separator);
}

/** Whether an addon page is shown without the admin shell. */
export function isPublicAddonPage(name: string): boolean {
    return Object.hasOwn(publicAddonPages, name);
}

function activeSlugs(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : [];
}

/**
 * The loader for an addon page, or undefined when the page must not be shown. A page needs both things: it is in the
 * build, and its addon is active, as the server reports in the shared `addons` prop. A deactivated addon's chunk can
 * still be in the build, so the build alone is not enough.
 */
export function resolveAddonPage(
    name: string,
    addons: unknown,
): AddonPageLoader | undefined {
    const slug = addonSlugOf(name);

    if (slug === null || !activeSlugs(addons).includes(slug)) {
        return undefined;
    }

    if (Object.hasOwn(publicAddonPages, name)) {
        return publicAddonPages[name];
    }

    if (Object.hasOwn(appAddonPages, name)) {
        return appAddonPages[name];
    }

    return undefined;
}
