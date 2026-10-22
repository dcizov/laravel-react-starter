import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { useTrans } from '@/hooks/use-trans';
import type { TermRef } from '@/types/cms';

// The category and tag filters of an archive or the blog. Each link keeps the same base address,
// with ?category= or ?tag= added. Only terms of this content type are listed.
export default function TermFilter({
    basePath,
    filter,
    categories,
    tags,
}: {
    basePath: string;
    filter: { taxonomy: 'category' | 'tag'; name: string } | null;
    categories: TermRef[];
    tags: TermRef[];
}) {
    const t = useTrans();

    if (!filter && categories.length === 0 && tags.length === 0) {
        return null;
    }

    return (
        <div className="mt-6 flex flex-col gap-3">
            {filter && (
                <p className="text-muted-foreground">
                    {t('Showing :name', { name: filter.name })} ·{' '}
                    <Link href={basePath} className="underline">
                        {t('Show all')}
                    </Link>
                </p>
            )}
            <TermLinks
                basePath={basePath}
                label={t('Categories')}
                taxonomy="category"
                terms={categories}
            />
            <TermLinks
                basePath={basePath}
                label={t('Tags')}
                taxonomy="tag"
                terms={tags}
            />
        </div>
    );
}

function TermLinks({
    basePath,
    label,
    taxonomy,
    terms,
}: {
    basePath: string;
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
                    href={`${basePath}?${taxonomy}=${encodeURIComponent(term.slug)}`}
                >
                    <Badge variant="outline">{term.name}</Badge>
                </Link>
            ))}
        </div>
    );
}
