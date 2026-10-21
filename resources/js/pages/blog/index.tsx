import { Link } from '@inertiajs/react';
import Pagination from '@/components/cms/pagination';
import PublicLayout from '@/components/cms/public-layout';
import SeoMeta from '@/components/cms/seo-meta';
import { Badge } from '@/components/ui/badge';
import { useTrans } from '@/hooks/use-trans';
import { EntryList } from '@/pages/content/archive';
import type { EntrySummary, Paginated, SeoData, TermRef } from '@/types/cms';

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
            <h1 className="text-3xl font-bold tracking-tight">{t('Blog')}</h1>

            {filter && (
                <p className="mt-3 text-muted-foreground">
                    {t('Showing :name', { name: filter.name })} ·{' '}
                    <Link href="/blog" className="underline">
                        {t('Show all posts')}
                    </Link>
                </p>
            )}

            {(categories.length > 0 || tags.length > 0) && (
                <div className="mt-6 flex flex-col gap-3">
                    <TermLinks
                        label={t('Categories')}
                        taxonomy="category"
                        terms={categories}
                    />
                    <TermLinks label={t('Tags')} taxonomy="tag" terms={tags} />
                </div>
            )}

            <div className="mt-8">
                <EntryList entries={posts} emptyText={t('No posts yet.')} />
            </div>
            <Pagination links={posts.links} />
        </PublicLayout>
    );
}

function TermLinks({
    label,
    taxonomy,
    terms,
}: {
    label: string;
    taxonomy: 'category' | 'tag';
    terms: TermRef[];
}) {
    if (terms.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{label}:</span>
            {terms.map((term) => (
                <Link
                    key={term.id}
                    href={`/blog?${taxonomy}=${encodeURIComponent(term.slug)}`}
                >
                    <Badge variant="outline">{term.name}</Badge>
                </Link>
            ))}
        </div>
    );
}
