import { Link } from '@inertiajs/react';
import Pagination from '@/components/cms/pagination';
import PublicLayout from '@/components/cms/public-layout';
import SeoMeta from '@/components/cms/seo-meta';
import { buttonVariants } from '@/components/ui/button';
import { useSiteBase } from '@/hooks/use-site-base';
import { useTrans } from '@/hooks/use-trans';
import { EntryList } from '@/pages/content/archive';
import type { EntrySummary, Paginated, SeoData } from '@/types/cms';

// One author's posts on this site. Only live posts are listed, so an author with none has no page.
export default function BlogAuthor({
    author,
    posts,
    seo,
}: {
    author: { id: number; name: string };
    posts: Paginated<EntrySummary>;
    seo: SeoData;
}) {
    const t = useTrans();
    const base = useSiteBase();

    return (
        <PublicLayout>
            <SeoMeta seo={seo} />
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t('Posts by :name', { name: author.name })}
                </h1>
                <Link
                    href={`${base}/blog`}
                    className={buttonVariants({
                        variant: 'outline',
                        size: 'sm',
                    })}
                >
                    {t('All posts')}
                </Link>
            </div>
            <div className="mt-8">
                <EntryList entries={posts} emptyText={t('No posts yet.')} />
            </div>
            <Pagination links={posts.links} />
        </PublicLayout>
    );
}
