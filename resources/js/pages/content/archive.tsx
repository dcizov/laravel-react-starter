import { Link } from '@inertiajs/react';
import Pagination from '@/components/cms/pagination';
import PublicLayout from '@/components/cms/public-layout';
import SeoMeta from '@/components/cms/seo-meta';
import TermFilter from '@/components/cms/term-filter';
import { useSiteBase } from '@/hooks/use-site-base';
import { useTrans } from '@/hooks/use-trans';
import type { EntrySummary, Paginated, SeoData, TermRef } from '@/types/cms';

// The archive of a content type. ?category= and ?tag= narrow it to one term of this type.
export default function ContentArchive({
    type,
    entries,
    filter,
    categories,
    tags,
    seo,
}: {
    type: { key: string; label: string; singular: string };
    entries: Paginated<EntrySummary>;
    filter: { taxonomy: 'category' | 'tag'; name: string; slug: string } | null;
    categories: TermRef[];
    tags: TermRef[];
    seo: SeoData;
}) {
    const t = useTrans();
    const base = useSiteBase();

    return (
        <PublicLayout>
            <SeoMeta seo={seo} />
            <h1 className="text-2xl font-semibold tracking-tight">
                {type.label}
            </h1>
            <TermFilter
                basePath={`${base}/content/${type.key}`}
                filter={filter}
                categories={categories}
                tags={tags}
            />
            <div className="mt-8">
                <EntryList
                    entries={entries}
                    emptyText={t('Nothing has been published yet.')}
                />
            </div>
            <Pagination links={entries.links} />
        </PublicLayout>
    );
}

// The list of cards used by the content archives and the blog. The title links to the entry.
export function EntryList({
    entries,
    emptyText,
}: {
    entries: Paginated<EntrySummary>;
    emptyText: string;
}) {
    if (entries.data.length === 0) {
        return <p className="text-muted-foreground">{emptyText}</p>;
    }

    return (
        <ul className="flex flex-col divide-y">
            {entries.data.map((entry) => (
                <li key={entry.id} className="flex gap-5 py-5">
                    {entry.featuredImage && (
                        <img
                            src={entry.featuredImage}
                            alt=""
                            loading="lazy"
                            className="hidden h-24 w-36 shrink-0 rounded-lg border object-cover sm:block"
                        />
                    )}
                    <div className="flex min-w-0 flex-col gap-1">
                        <p className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
                            {entry.publishedAt && (
                                <time>
                                    {new Date(
                                        entry.publishedAt,
                                    ).toLocaleDateString('de-DE')}
                                </time>
                            )}
                            {entry.author && (
                                <span>
                                    {entry.author.url ? (
                                        <Link
                                            href={entry.author.url}
                                            className="hover:underline"
                                        >
                                            {entry.author.name}
                                        </Link>
                                    ) : (
                                        entry.author.name
                                    )}
                                </span>
                            )}
                        </p>
                        <h2 className="text-xl font-semibold">
                            <Link href={entry.url} className="hover:underline">
                                {entry.title}
                            </Link>
                        </h2>
                        {entry.excerpt && (
                            <p className="text-muted-foreground">
                                {entry.excerpt}
                            </p>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}
