import { Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ThemeShell } from '@/components/themes/theme-shell';
import type { ThemePageProps } from '@/components/themes/theme-shell';

export default function MeridianNotFound({
    site,
    menus,
    theme,
}: ThemePageProps) {
    return (
        <>
            <Head title="Page not found">
                <meta name="robots" content="noindex" />
            </Head>

            <ThemeShell
                site={site}
                menus={menus}
                theme={theme}
                variant="compact"
            >
                <div className="mx-auto w-full max-w-5xl px-6 py-20">
                    <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
                        404 / not found
                    </p>
                    <h1 className="mt-4 font-mono text-3xl font-bold tracking-tight sm:text-4xl">
                        Nothing at this address.
                    </h1>
                    <p className="mt-3 max-w-md text-sm text-muted-foreground">
                        Check the URL, or start again from the home page.
                    </p>
                    <a
                        href={site.home_url}
                        className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white"
                        style={{
                            backgroundColor: theme.tokens.accent,
                            borderRadius: 'var(--theme-radius)',
                        }}
                    >
                        <ArrowLeft className="size-4" />
                        Home
                    </a>
                </div>
            </ThemeShell>
        </>
    );
}
