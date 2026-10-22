import { Link } from '@inertiajs/react';
import Pagination from '@/components/cms/pagination';
import PublicLayout from '@/components/cms/public-layout';
import SeoMeta from '@/components/cms/seo-meta';
import TermFilter from '@/components/cms/term-filter';
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

    return (
        <PublicLayout>
            <SeoMeta seo={seo} />
            <h1 className="text-3xl font-bold tracking-tight">{type.label}</h1>
            <TermFilter
                basePath={`/content/${type.key}`}
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
                <li key={entry.id} className="flex flex-col gap-1 py-5">
                    {entry.publishedAt && (
                        <time className="text-sm text-muted-foreground">
                            {new Date(entry.publishedAt).toLocaleDateString(
                                'de-DE',
                            )}
                        </time>
                    )}
                    <h2 className="text-xl font-semibold">
                        <Link href={entry.url} className="hover:underline">
                            {entry.title}
                        </Link>
                    </h2>
                    {entry.excerpt && (
                        <p className="text-muted-foreground">{entry.excerpt}</p>
                    )}
                </li>
            ))}
        </ul>
    );
}
