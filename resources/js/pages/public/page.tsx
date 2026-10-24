import { Head } from '@inertiajs/react';
import { SectionList } from '@/components/sections/section-renderer';
import { ThemeBand, ThemeShell } from '@/components/themes/theme-shell';
import type { ThemePageProps } from '@/components/themes/theme-shell';
import type { SectionBlock } from '@/lib/sections';

type Props = ThemePageProps & {
    page: {
        id: number;
        title: string;
        slug: string;
        excerpt: string | null;
        content: SectionBlock[];
        seo_title: string;
        seo_description: string | null;
        robots: string;
        published_at: string | null;
        updated_at: string | null;
    };
};

/**
 * The core renderer: used when no theme is active, and as the Safe Mode
 * fallback when the active theme cannot boot. It reads the same props as a
 * theme, so falling back never changes the payload contract.
 */
export default function PublicPage({ page, site, menus, theme }: Props) {
    const noindex = page.robots.includes('noindex');

    return (
        <>
            <Head title={page.seo_title}>
                <meta name="description" content={page.seo_description ?? site.description} />
                <meta property="og:title" content={page.seo_title} />
                <meta property="og:description" content={page.seo_description ?? site.description} />
                <meta property="og:type" content="website" />
                {noindex ? <meta name="robots" content="noindex,nofollow" /> : null}
            </Head>

            <ThemeShell site={site} menus={menus} theme={theme} variant="wide">
                {(page.content ?? []).length === 0 ? (
                    <ThemeBand>
                        <p className="text-muted-foreground text-center text-sm">
                            This page has no sections yet.
                        </p>
                    </ThemeBand>
                ) : (
                    <ThemeBand>
                        <SectionList blocks={page.content} />
                    </ThemeBand>
                )}
            </ThemeShell>
        </>
    );
}
