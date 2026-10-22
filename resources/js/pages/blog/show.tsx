import Comments from '@/components/cms/comments';
import type { PublicComment } from '@/components/cms/comments';
import EntryArticle from '@/components/cms/entry-article';
import PublicLayout from '@/components/cms/public-layout';
import SeoMeta from '@/components/cms/seo-meta';
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
    return (
        <PublicLayout>
            <SeoMeta seo={entry.seo} />
            <EntryArticle entry={entry} />

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
