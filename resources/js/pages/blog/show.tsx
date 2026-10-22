import Comments from '@/components/cms/comments';
import type { PublicComment } from '@/components/cms/comments';
import EntryArticle from '@/components/cms/entry-article';
import PublicLayout from '@/components/cms/public-layout';
import SeoMeta from '@/components/cms/seo-meta';
import { ShareLinks } from '@/components/cms/share-links';
import { useSiteBase } from '@/hooks/use-site-base';
import { useTrans } from '@/hooks/use-trans';
import { readingMinutes } from '@/lib/reading-time';
import type { PublicEntry } from '@/types/cms';

export default function BlogShow({
    entry,
    commentsEnabled,
    comments,
}: {
    entry: PublicEntry;
    commentsEnabled: boolean;
    comments: PublicComment[];
}) {
    const t = useTrans();
    const base = useSiteBase();
    const minutes = readingMinutes(entry.body);

    return (
        <PublicLayout>
            <SeoMeta seo={entry.seo} feedUrl={`${base}/blog/feed.xml`} />
            <EntryArticle entry={entry} />

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
                <p className="text-sm text-muted-foreground">
                    {t(':minutes min read', { minutes })}
                </p>
                {entry.seo.canonical && (
                    <ShareLinks url={entry.seo.canonical} title={entry.title} />
                )}
            </div>

            {commentsEnabled && (
                <Comments
                    typeKey={entry.type.key}
                    slug={entry.slug}
                    comments={comments}
                />
            )}
        </PublicLayout>
    );
}
