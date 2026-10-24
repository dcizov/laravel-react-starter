import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { cn } from '@/lib/utils';

export type SiteProps = {
    name: string;
    tagline: string;
    description: string;
    home_url: string;
    year: number;
};

export type MenuLink = {
    id: number;
    label: string;
    url: string;
    children: MenuLink[];
};

export type ThemeProps = {
    handle: string;
    name: string;
    tokens: Record<string, string>;
    degraded: boolean;
};

export type ThemePageProps = {
    site: SiteProps;
    menus: Record<string, MenuLink[]>;
    theme: ThemeProps;
};

/**
 * The public chrome shared by the core renderer and every theme: header with
 * the `main` menu, footer with the `footer` menu and the site identity.
 *
 * A theme only changes tokens and rhythm — the menus come from the database, so
 * no theme ever hardcodes navigation.
 */
export function ThemeShell({
    site,
    menus,
    theme,
    variant = 'wide',
    children,
}: ThemePageProps & {
    variant?: 'wide' | 'compact';
    children: ReactNode;
}) {
    const main = menus.main ?? [];
    const footer = menus.footer ?? [];
    const cta = main.length > 1 ? main[main.length - 1] : null;
    const links = cta === null ? main : main.slice(0, -1);
    const accent = theme.tokens.accent ?? 'oklch(0.51 0.19 264)';
    // Branding is site identity, so it arrives once in the shared props rather
    // than being threaded through every public controller.
    const logo =
        usePage<{ settings?: { public?: { logo?: string | null } } }>().props
            .settings?.public?.logo ?? null;

    return (
        <div
            className="flex min-h-screen flex-col bg-background text-foreground"
            style={{
                // The theme writes tokens; the markup reads them. No component
                // knows which theme it is rendering under.
                ['--theme-accent' as string]: accent,
                ['--theme-radius' as string]: theme.tokens.radius ?? '0.625rem',
                ['--radius' as string]: theme.tokens.radius ?? '0.625rem',
                fontFamily: `'${theme.tokens.font ?? 'Inter'}', system-ui, sans-serif`,
            }}
            data-theme={theme.handle}
        >
            <a
                href="#site-content"
                className="sr-only bg-background focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:text-sm focus:ring-2 focus:ring-ring"
            >
                Skip to content
            </a>

            <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
                <div
                    className={cn(
                        'mx-auto flex w-full items-center justify-between gap-4 px-6',
                        variant === 'wide'
                            ? 'max-w-6xl py-4'
                            : 'max-w-5xl py-3',
                    )}
                >
                    <a
                        href={site.home_url}
                        className="flex items-center gap-2.5 text-sm font-semibold tracking-tight"
                        aria-label={`${site.name} — home`}
                    >
                        {logo ? (
                            <img
                                src={logo}
                                alt=""
                                className="h-7 w-auto max-w-40 object-contain"
                            />
                        ) : (
                            <span
                                className="flex size-7 items-center justify-center rounded-[calc(var(--theme-radius)/1.5)] text-white"
                                style={{ backgroundColor: accent }}
                            >
                                <AppLogoIcon className="size-4" />
                            </span>
                        )}
                        {logo ? (
                            <span className="sr-only">{site.name}</span>
                        ) : (
                            site.name
                        )}
                    </a>

                    {links.length > 0 || cta !== null ? (
                        <nav
                            className="flex items-center gap-1 text-sm text-muted-foreground"
                            aria-label="Main"
                        >
                            {links.map((item) => (
                                <a
                                    key={item.id}
                                    href={item.url}
                                    className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    {item.label}
                                </a>
                            ))}
                            {cta !== null ? (
                                <a
                                    href={cta.url}
                                    className="ml-1 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                                    style={{ backgroundColor: accent }}
                                >
                                    {cta.label}
                                </a>
                            ) : null}
                        </nav>
                    ) : null}
                </div>
            </header>

            <main id="site-content" className="flex-1">
                {children}
            </main>

            <footer className="mt-auto border-t border-border/60">
                <div
                    className={cn(
                        'mx-auto flex w-full flex-col gap-4 px-6 py-10 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between',
                        variant === 'wide' ? 'max-w-6xl' : 'max-w-5xl',
                    )}
                >
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                            {site.name}
                        </p>
                        <p>{site.tagline}</p>
                    </div>

                    {footer.length > 0 ? (
                        <nav
                            className="flex flex-wrap items-center gap-4"
                            aria-label="Footer"
                        >
                            {footer.map((item) => (
                                <a
                                    key={item.id}
                                    href={item.url}
                                    className="transition-colors hover:text-foreground"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>
                    ) : null}

                    <p>
                        © {site.year} {site.name}
                    </p>
                </div>
            </footer>
        </div>
    );
}

/**
 * Wide editorial band used by both themes as the page rhythm between sections.
 */
export function ThemeBand({
    children,
    tone = 'plain',
    variant = 'wide',
}: {
    children: ReactNode;
    tone?: 'plain' | 'muted';
    variant?: 'wide' | 'compact';
}) {
    return (
        <section
            className={cn(
                'px-6',
                tone === 'muted' ? 'bg-muted/40' : 'bg-background',
                variant === 'wide' ? 'py-16 sm:py-24' : 'py-12 sm:py-16',
            )}
        >
            <div
                className={cn(
                    'mx-auto w-full',
                    variant === 'wide' ? 'max-w-6xl' : 'max-w-5xl',
                )}
            >
                {children}
            </div>
        </section>
    );
}
