import ContentBlocks from '@/components/cms/content-blocks';
import { Badge } from '@/components/ui/badge';
import type { PublicEntry } from '@/types/cms';

// The article view shared by content entries and blog posts: title, date, terms, image, body and custom fields.
export default function EntryArticle({ entry }: { entry: PublicEntry }) {
    const date = entry.publishedAt
        ? new Date(entry.publishedAt).toLocaleDateString('de-DE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : null;

    return (
        <article className="flex flex-col gap-6">
            <header className="flex flex-col gap-3">
                {date && (
                    <time className="text-sm text-muted-foreground">
                        {date}
                    </time>
                )}
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                    {entry.title}
                </h1>
                {entry.excerpt && (
                    <p className="text-lg text-muted-foreground">
                        {entry.excerpt}
                    </p>
                )}
                {(entry.terms.category.length > 0 ||
                    entry.terms.tag.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                        {[...entry.terms.category, ...entry.terms.tag].map(
                            (term) => (
                                <Badge key={term.id} variant="secondary">
                                    {term.name}
                                </Badge>
                            ),
                        )}
                    </div>
                )}
            </header>

            {entry.featuredImage && (
                <img
                    src={entry.featuredImage}
                    alt=""
                    className="w-full rounded-xl border object-cover"
                />
            )}

            <ContentBlocks blocks={entry.body} />

            {entry.customFields.some(
                (field) => field.value !== null && field.value !== '',
            ) && (
                <dl className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
                    {entry.customFields
                        .filter(
                            (field) =>
                                field.value !== null && field.value !== '',
                        )
                        .map((field) => (
                            <div key={field.key}>
                                <dt className="text-sm text-muted-foreground">
                                    {field.label}
                                </dt>
                                <dd className="font-medium break-words">
                                    {field.type === 'boolean'
                                        ? field.value
                                            ? '✓'
                                            : '–'
                                        : String(field.value)}
                                </dd>
                            </div>
                        ))}
                </dl>
            )}
        </article>
    );
}
