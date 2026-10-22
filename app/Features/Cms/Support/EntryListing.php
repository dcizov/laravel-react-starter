<?php

namespace App\Features\Cms\Support;

use App\Features\Cms\Models\Comment;
use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\Term;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * Shared pieces of the public lists (archives and the blog): the category and tag filter, and approved comments.
 */
final class EntryListing
{
    /**
     * The category or tag chosen in the query string (?category=slug or ?tag=slug), limited to the type's own terms.
     * The lists of categories and tags only include terms that have at least one live entry.
     *
     * @return array{term: Term|null, filter: array{taxonomy: string, name: string, slug: string}|null, categories: list<array{id: int, name: string, slug: string}>, tags: list<array{id: int, name: string, slug: string}>}
     */
    public static function terms(string $contentType, Request $request): array
    {
        $term = null;

        foreach ([Term::CATEGORY, Term::TAG] as $taxonomy) {
            if ($term === null && $request->filled($taxonomy)) {
                $term = Term::query()
                    ->forType($contentType)
                    ->where('taxonomy', $taxonomy)
                    ->where('slug', (string) $request->input($taxonomy))
                    ->first();
            }
        }

        return [
            'term' => $term,
            'filter' => $term ? ['taxonomy' => $term->taxonomy, 'name' => $term->name, 'slug' => $term->slug] : null,
            'categories' => self::liveTerms($contentType, Term::CATEGORY),
            'tags' => self::liveTerms($contentType, Term::TAG),
        ];
    }

    /**
     * Keeps the entries that have the chosen term.
     *
     * @param  Builder<ContentEntry>  $query
     * @return Builder<ContentEntry>
     */
    public static function filter(Builder $query, ?Term $term): Builder
    {
        return $term === null
            ? $query
            : $query->whereHas('terms', fn (Builder $inner) => $inner->whereKey($term->id));
    }

    /**
     * The approved comments of an entry, ready for the browser. Pending and spam comments are never included.
     *
     * @return list<array{id: int, author: string, body: string, createdAt: string|null}>
     */
    public static function approvedComments(ContentEntry $entry): array
    {
        return $entry->comments()->approved()->oldest()->get()->map(fn (Comment $comment) => [
            'id' => $comment->id,
            'author' => $comment->author_name,
            'body' => $comment->body,
            'createdAt' => $comment->created_at?->toIso8601String(),
        ])->values()->all();
    }

    /**
     * @return list<array{id: int, name: string, slug: string}>
     */
    private static function liveTerms(string $contentType, string $taxonomy): array
    {
        return Term::query()
            ->forType($contentType)
            ->where('taxonomy', $taxonomy)
            ->whereHas('entries', fn ($query) => $query->where('content_type', $contentType)->live())
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Term $term) => ['id' => $term->id, 'name' => $term->name, 'slug' => $term->slug])
            ->values()
            ->all();
    }
}
