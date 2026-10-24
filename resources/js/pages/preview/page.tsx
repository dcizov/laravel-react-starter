import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { SectionList } from '@/components/sections/section-renderer';
import { ThemeBand, ThemeShell } from '@/components/themes/theme-shell';
import type { ThemePageProps } from '@/components/themes/theme-shell';
import { Button } from '@/components/ui/button';
import type { PageStatus, SectionBlock } from '@/lib/sections';

type SectionDataMap = Record<string, Record<string, unknown>>;

type Props = ThemePageProps & {
    section_data?: SectionDataMap;
    page: {
        id: number;
        title: string;
        slug: string;
        status: PageStatus;
        content: SectionBlock[];
        seo_title: string | null;
        seo_description: string | null;
    };
    edit_url: string | null;
};

/**
 * Draft preview: the real content inside the active theme's tokens, with a
 * banner that says exactly what is being previewed and how to get back.
 */
export default function PreviewPage({
    page,
    site,
    menus,
    theme,
    edit_url,
    section_data = {},
}: Props) {
    return (
        <>
            <Head title={`Preview · ${page.seo_title ?? page.title}`}>
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-status-scheduled/30 bg-status-scheduled-soft px-4 py-2 text-xs text-status-scheduled">
                <span className="flex items-center gap-2 font-medium">
                    <Eye className="size-3.5" />
                    Preview · {page.status} · /{page.slug} · theme {theme.name}
                </span>
                <span className="flex items-center gap-2">
                    <span className="hidden sm:inline">
                        This URL is signed and expires in six hours.
                    </span>
                    {edit_url ? (
                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-7"
                        >
                            <Link href={edit_url}>
                                <ArrowLeft className="size-3.5" />
                                Back to editor
                            </Link>
                        </Button>
                    ) : null}
                </span>
            </div>

            <ThemeShell site={site} menus={menus} theme={theme} variant="wide">
                <ThemeBand>
                    <SectionList
                        blocks={page.content ?? []}
                        data={section_data}
                        emptyLabel="Nothing to preview yet."
                    />
                </ThemeBand>
            </ThemeShell>
        </>
    );
}
