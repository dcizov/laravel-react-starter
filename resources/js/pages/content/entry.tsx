import EntryArticle from '@/components/cms/entry-article';
import PublicLayout from '@/components/cms/public-layout';
import SeoMeta from '@/components/cms/seo-meta';
import type { PublicEntry } from '@/types/cms';

export default function ContentEntry({ entry }: { entry: PublicEntry }) {
    return (
        <PublicLayout>
            <SeoMeta seo={entry.seo} />
            <EntryArticle entry={entry} />
        </PublicLayout>
    );
}
