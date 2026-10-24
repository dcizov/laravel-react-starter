/**
 * The only schemes an authored link may use. Content can arrive from a seeder,
 * an addon or an import, so the renderer refuses anything else rather than
 * trusting that the server validated it (`javascript:`/`data:` in an `href` is
 * executable).
 */
const SAFE_HREF = /^(?:https?:\/\/|\/|#|\?)/i;

/**
 * Returns a link that is safe to render, or `null` when the value must not be
 * turned into an `href` at all.
 */
export function safeHref(value: string | null | undefined): string | null {
    const url = (value ?? '').trim();

    if (url === '' || !SAFE_HREF.test(url) || /\s/.test(url)) {
        return null;
    }

    return url;
}
