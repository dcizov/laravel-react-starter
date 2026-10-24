import { Head } from '@inertiajs/react';
import { SectionList } from '@/components/sections/section-renderer';
import { ThemeShell } from '@/components/themes/theme-shell';
import type { ThemePageProps } from '@/components/themes/theme-shell';
import type { SectionBlock } from '@/lib/sections';

type SectionDataMap = Record<string, Record<string, unknown>>;

type Props = ThemePageProps & {
    section_data?: SectionDataMap;
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
 * Theme B — Meridian. Same components, different tokens: compact rhythm, a
 * single continuous canvas, condensed headings. It exists to prove that a theme
 * is a token layer, not a fork of the renderer.
 */
export default function MeridianPage({ page, site, menus, theme, section_data = {} }: Props) {
    const blocks = page.content ?? [];

    return (
        <>
            <Head title={page.seo_title}>
                <meta name="description" content={page.seo_description ?? site.description} />
                <meta property="og:title" content={page.seo_title} />
                <meta property="og:description" content={page.seo_description ?? site.description} />
                <meta property="og:type" content="website" />
                {page.robots.includes('noindex') ? <meta name="robots" content="noindex,nofollow" /> : null}
            </Head>

            <ThemeShell site={site} menus={menus} theme={theme} variant="compact">
                <div className="mx-auto w-full max-w-5xl divide-y divide-border/60 px-6">
                    <SectionList
                        blocks={blocks}
                        data={section_data}
                        emptyLabel="This page has no sections yet."
                    />
                </div>
            </ThemeShell>
        </>
    );
}
