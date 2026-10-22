import { Rss, Search } from 'lucide-react';
import Pagination from '@/components/cms/pagination';
import PublicLayout from '@/components/cms/public-layout';
import SeoMeta from '@/components/cms/seo-meta';
import TermFilter from '@/components/cms/term-filter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSiteBase } from '@/hooks/use-site-base';
import { useTrans } from '@/hooks/use-trans';
import { EntryList } from '@/pages/content/archive';
import type { EntrySummary, Paginated, SeoData, TermRef } from '@/types/cms';

// The blog: the posts, with search, the categories and tags of posts only, and a link to the RSS feed.
export default function BlogIndex({
    posts,
    filter,
    search,
    categories,
    tags,
    feedUrl,
    seo,
}: {
    posts: Paginated<EntrySummary>;
    filter: { taxonomy: 'category' | 'tag'; name: string; slug: string } | null;
    search: string;
    categories: TermRef[];
    tags: TermRef[];
    feedUrl: string;
    seo: SeoData;
}) {
    const t = useTrans();
    const base = useSiteBase();

    return (
        <PublicLayout>
            <SeoMeta seo={seo} feedUrl={feedUrl} />
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t('Blog')}
                </h1>
                <a
                    href={feedUrl}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline"
                >
                    <Rss className="size-4" aria-hidden="true" />
                    {t('RSS feed')}
                </a>
            </div>

            {/* A GET form, so the search can be bookmarked and shared. The current category or tag is kept. */}
            <form
                method="get"
                action={`${base}/blog`}
                role="search"
                className="mt-6 flex gap-2"
            >
                {filter && (
                    <input
                        type="hidden"
                        name={filter.taxonomy}
                        value={filter.slug}
                    />
                )}
                <Input
                    type="search"
                    name="q"
                    defaultValue={search}
                    placeholder={t('Search title or excerpt')}
                    aria-label={t('Search posts')}
                    className="max-w-sm"
                />
                <Button type="submit" variant="outline">
                    <Search aria-hidden="true" />
                    {t('Search')}
                </Button>
            </form>

            <TermFilter
                basePath={`${base}/blog`}
                filter={filter}
                categories={categories}
                tags={tags}
            />
            <div className="mt-8">
                <EntryList
                    entries={posts}
                    emptyText={
                        search
                            ? t('No posts match your search.')
                            : t('No posts yet.')
                    }
                />
            </div>
            <Pagination links={posts.links} />
        </PublicLayout>
    );
}
