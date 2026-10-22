// The public address of an entry, without the site's base path. Pages use /pages/{slug}, posts use /blog/{slug},
// and other types use /content/{type}/{slug}. Prefix it with the site's base path to get the full address.
export function publicPath(typeKey: string, slug: string): string {
    if (typeKey === 'page') {
        return `/pages/${slug}`;
    }

    if (typeKey === 'post') {
        return `/blog/${slug}`;
    }

    return `/content/${typeKey}/${slug}`;
}
