<?php

namespace App\Features\Cms\Support;

use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Features\FeatureRegistry;
use App\Support\Seo\SeoHead;
use App\Support\Sites\CurrentSite;
use Illuminate\Support\Facades\Route;

/**
 * Turns content into the arrays the pages receive. Keeps the URL rules in one place.
 */
final class ContentPresenter
{
    /**
     * The public address of an entry. Posts use /blog when the blog feature is on.
     */
    public static function url(ContentEntry $entry): string
    {
        if ($entry->content_type === 'page') {
            return route('pages.show', $entry->slug);
        }

        if ($entry->content_type === 'post' && app(FeatureRegistry::class)->isEnabled('blog')) {
            return route('blog.show', $entry->slug);
        }

        return route('content.show', [$entry->content_type, $entry->slug]);
    }

    /**
     * The public address of an entry on the site the admin is working on. Admin pages cannot use route() for this,
     * because they are not under the site's own prefix, so the path is taken from the public route and joined to the
     * site's own address.
     */
    public static function publicUrlFor(ContentEntry $entry): string
    {
        $path = (string) parse_url(self::url($entry), PHP_URL_PATH);
        $site = app(CurrentSite::class)->site();
        // The default site's route is already the right address when the admin works on it.
        $base = $site->isDefault() ? rtrim((string) config('app.url'), '/') : rtrim($site->publicUrl(), '/');

        return $base.$path;
    }

    /**
     * The name shown as the author, with a link to their author page when the blog has one.
     *
     * @return array{name: string, url: string|null}|null
     */
    public static function author(ContentEntry $entry): ?array
    {
        $entry->loadMissing('author');

        if ($entry->author === null) {
            return null;
        }

        return [
            'name' => $entry->author->name,
            'url' => Route::has('blog.author') && app(FeatureRegistry::class)->isEnabled('blog')
                ? route('blog.author', $entry->author_id)
                : null,
        ];
    }

    /**
     * A short form for lists and archives.
     *
     * @return array<string, mixed>
     */
    public static function summary(ContentEntry $entry): array
    {
        return [
            'id' => $entry->id,
            'title' => $entry->title,
            'slug' => $entry->slug,
            'excerpt' => $entry->excerpt,
            'featuredImage' => $entry->featured_image,
            'publishedAt' => $entry->published_at?->toIso8601String(),
            'author' => self::author($entry),
            'url' => self::url($entry),
        ];
    }

    /**
     * The full public page for one entry, with its call-to-action blocks resolved and its SEO worked out.
     *
     * @return array<string, mixed>
     */
    public static function page(ContentEntry $entry, ContentType $type): array
    {
        $entry->loadMissing('terms');

        $customFields = collect($type->fields ?? [])
            ->map(fn (array $field) => [
                'key' => $field['key'],
                'label' => $field['label'],
                'type' => $field['type'],
                'value' => $entry->custom_fields[$field['key']] ?? null,
            ])
            ->filter(fn (array $field) => $field['value'] !== null && $field['value'] !== '')
            ->values()
            ->all();

        $terms = ['category' => [], 'tag' => []];

        foreach ($entry->terms as $term) {
            $terms[$term->taxonomy][] = ['id' => $term->id, 'name' => $term->name, 'slug' => $term->slug];
        }

        $url = self::url($entry);

        return [
            'id' => $entry->id,
            'title' => $entry->title,
            'slug' => $entry->slug,
            'excerpt' => $entry->excerpt,
            'featuredImage' => $entry->featured_image,
            'publishedAt' => $entry->published_at?->toIso8601String(),
            'author' => self::author($entry),
            'type' => [
                'key' => $type->key,
                'label' => $type->label,
                'singular' => $type->singular_label,
            ],
            'body' => ContentBlocks::resolveCtas($entry->body ?? []),
            'terms' => $terms,
            'customFields' => $customFields,
            'seo' => SeoHead::for(
                title: $entry->title,
                description: $entry->excerpt,
                image: $entry->featured_image,
                canonical: $url,
                overrides: $entry->seo,
            ),
        ];
    }

    /**
     * The entry as the editor needs it.
     *
     * @return array<string, mixed>
     */
    public static function editable(ContentEntry $entry): array
    {
        $entry->loadMissing('terms');

        return [
            'id' => $entry->id,
            'title' => $entry->title,
            'slug' => $entry->slug,
            'excerpt' => $entry->excerpt,
            'featuredImage' => $entry->featured_image,
            'status' => $entry->status,
            'publishedAt' => $entry->published_at?->toIso8601String(),
            'customFields' => (object) ($entry->custom_fields ?? []),
            'seo' => [
                'title' => $entry->seo['title'] ?? null,
                'description' => $entry->seo['description'] ?? null,
                'noindex' => (bool) ($entry->seo['noindex'] ?? false),
            ],
            'termIds' => $entry->terms->pluck('id')->values()->all(),
            'blocks' => $entry->body ?? [],
            'url' => $entry->isLive() ? self::publicUrlFor($entry) : null,
        ];
    }
}
