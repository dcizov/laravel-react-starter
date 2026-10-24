import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { SectionList } from '@/components/sections/section-renderer';
import { Button } from '@/components/ui/button';
import type { PageStatus, SectionBlock } from '@/lib/sections';

type Props = {
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

export default function PreviewPage({ page, edit_url }: Props) {
    return (
        <>
            <Head title={`Preview · ${page.seo_title ?? page.title}`}>
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="bg-status-scheduled-soft text-status-scheduled flex flex-wrap items-center justify-between gap-3 border-b border-status-scheduled/30 px-4 py-2 text-xs">
                <span className="flex items-center gap-2 font-medium">
                    <Eye className="size-3.5" />
                    Preview · {page.status} · /{page.slug}
                </span>
                {edit_url ? (
                    <Button asChild size="sm" variant="outline" className="h-7">
                        <Link href={edit_url}>
                            <ArrowLeft className="size-3.5" />
                            Back to editor
                        </Link>
                    </Button>
                ) : null}
            </div>

            <div className="bg-background text-foreground min-h-screen">
                <SectionList blocks={page.content ?? []} emptyLabel="Nothing to preview yet." />
            </div>
        </>
    );
}
