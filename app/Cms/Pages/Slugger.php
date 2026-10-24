<?php

declare(strict_types=1);

namespace App\Cms\Pages;

use App\Models\Page;
use App\Models\PageSlug;
use Illuminate\Support\Str;

/**
 * Slugs are stable and unique. Renaming keeps the old slug in `page_slugs` so
 * it can answer with a 301 instead of a 404.
 */
final class Slugger
{
    /**
     * @param  int|null  $ignorePageId  the page being renamed
     */
    public function unique(string $source, ?int $ignorePageId = null): string
    {
        $base = Str::slug($source);

        if ($base === '') {
            $base = 'page';
        }

        $slug = $this->available($base);
        $suffix = 2;

        while ($this->taken($slug, $ignorePageId)) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }

    /**
     * Remember the old slug, then adopt the new one.
     */
    public function rename(Page $page, string $newSlug): void
    {
        $newSlug = $this->unique($newSlug, $page->id);

        if ($newSlug === $page->slug) {
            return;
        }

        PageSlug::query()->firstOrCreate([
            'page_id' => $page->id,
            'slug' => $page->slug,
        ]);

        $page->forceFill(['slug' => $newSlug])->save();
    }

    /**
     * A generated slug must not collide with a path the application owns
     * (`/login`, `/admin`, …), so reserved words are qualified.
     */
    private function available(string $slug): string
    {
        /** @var list<string> $reserved */
        $reserved = config('lattice.reserved_slugs', []);

        return in_array($slug, $reserved, true) ? $slug.'-page' : $slug;
    }

    private function taken(string $slug, ?int $ignorePageId): bool
    {
        $exists = Page::withTrashed()
            ->where('slug', $slug)
            ->when($ignorePageId !== null, fn ($query) => $query->whereKeyNot($ignorePageId))
            ->exists();

        if ($exists) {
            return true;
        }

        // A historical slug cannot be reused either: it would shadow the 301.
        return PageSlug::query()->where('slug', $slug)->exists();
    }
}
