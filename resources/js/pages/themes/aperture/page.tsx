import { Head } from '@inertiajs/react';
import { SectionList } from '@/components/sections/section-renderer';
import { ThemeBand, ThemeShell } from '@/components/themes/theme-shell';
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
 * Theme A — Aperture. Editorial rhythm: a wide hero band, then every section on
 * its own generous band, alternating tone so long pages have a beat.
 */
export default function AperturePage({ page, site, menus, theme, section_data = {} }: Props) {
    const blocks = page.content ?? [];
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
                {blocks.length === 0 ? (
                    <ThemeBand>
                        <p className="text-muted-foreground text-center text-sm">
                            This page has no sections yet.
                        </p>
                    </ThemeBand>
                ) : (
                    blocks.map((block, index) => (
                        <ThemeBand key={block.id} tone={index % 2 === 1 ? 'muted' : 'plain'}>
                            <SectionList blocks={[block]} data={section_data} />
                        </ThemeBand>
                    ))
                )}
            </ThemeShell>
        </>
    );
}
