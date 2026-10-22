import Pagination from '@/components/cms/pagination';
import PublicLayout from '@/components/cms/public-layout';
import SeoMeta from '@/components/cms/seo-meta';
import TermFilter from '@/components/cms/term-filter';
import { useTrans } from '@/hooks/use-trans';
import { EntryList } from '@/pages/content/archive';
import type { EntrySummary, Paginated, SeoData, TermRef } from '@/types/cms';

// The blog: the posts, with the categories and tags of posts only.
export default function BlogIndex({
    posts,
    filter,
    categories,
    tags,
    seo,
}: {
    posts: Paginated<EntrySummary>;
    filter: { taxonomy: 'category' | 'tag'; name: string; slug: string } | null;
    categories: TermRef[];
    tags: TermRef[];
    seo: SeoData;
}) {
    const t = useTrans();

    return (
        <PublicLayout>
            <SeoMeta seo={seo} />
            <h1 className="text-2xl font-semibold tracking-tight">
                {t('Blog')}
            </h1>
            <TermFilter
                basePath="/blog"
                filter={filter}
                categories={categories}
                tags={tags}
            />
            <div className="mt-8">
                <EntryList entries={posts} emptyText={t('No posts yet.')} />
            </div>
            <Pagination links={posts.links} />
        </PublicLayout>
    );
}
