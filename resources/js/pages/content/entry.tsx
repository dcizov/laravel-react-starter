import Comments from '@/components/cms/comments';
import type { PublicComment } from '@/components/cms/comments';
import EntryArticle from '@/components/cms/entry-article';
import PublicLayout from '@/components/cms/public-layout';
import SeoMeta from '@/components/cms/seo-meta';
import type { PublicEntry } from '@/types/cms';

// A page or an entry of a custom type. Comments show only when the type has the comments support.
export default function ContentEntry({
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
