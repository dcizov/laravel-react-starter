import { Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ThemeShell } from '@/components/themes/theme-shell';
import type { ThemePageProps } from '@/components/themes/theme-shell';

/**
 * Theme A's 404. It keeps the chrome and the tokens so a wrong URL still looks
 * like the site rather than a bare error page.
 */
export default function ApertureNotFound({ site, menus, theme }: ThemePageProps) {
    return (
        <>
            <Head title="Page not found">
                <meta name="robots" content="noindex" />
            </Head>

            <ThemeShell site={site} menus={menus} theme={theme} variant="wide">
                <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-6 py-24">
                    <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                        404
                    </p>
                    <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                        This page has moved on.
                    </h1>
                    <p className="text-muted-foreground max-w-md">
                        The link may be old, or the page was never published. The rest of the site still works.
                    </p>
                    <a
                        href={site.home_url}
                        className="mt-2 inline-flex items-center gap-2 rounded-[var(--theme-radius)] px-4 py-2 text-sm font-medium text-white"
                        style={{ backgroundColor: theme.tokens.accent }}
                    >
                        <ArrowLeft className="size-4" />
                        Back to the home page
                    </a>
                </div>
            </ThemeShell>
        </>
    );
}
