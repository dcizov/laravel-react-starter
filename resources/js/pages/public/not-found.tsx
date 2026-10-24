import { Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ThemeShell } from '@/components/themes/theme-shell';
import type { ThemePageProps } from '@/components/themes/theme-shell';

/**
 * Core 404, used whenever no theme (or no healthy theme) supplies one. It ships
 * the same chrome as a themed page so a wrong URL never looks like a dead end.
 */
export default function NotFound({ site, menus, theme }: ThemePageProps) {
    return (
        <>
            <Head title="Page not found">
                <meta name="robots" content="noindex" />
            </Head>

            <ThemeShell site={site} menus={menus} theme={theme} variant="wide">
                <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-24 text-center">
                    <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                        404
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
                        This page has moved on.
                    </h1>
                    <p className="mt-3 max-w-md text-sm text-muted-foreground">
                        The link may be old, or the page was never published.
                        Try the home page.
                    </p>
                    <a
                        href={site.home_url}
                        className="mt-6 inline-flex items-center gap-2 rounded-[var(--theme-radius)] px-4 py-2 text-sm font-medium text-white"
                        style={{ backgroundColor: theme.tokens.accent }}
                    >
                        <ArrowLeft className="size-4" />
                        Back to the site
                    </a>
                </div>
            </ThemeShell>
        </>
    );
}
