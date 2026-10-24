<?php

declare(strict_types=1);

namespace App\Cms\Content;

use App\Cms\Settings\SettingRepository;
use App\Models\Page;

/**
 * Which page the public site serves at `/`.
 *
 * The homepage is configuration, never a coincidence. `content.homepage_slug`
 * (a documented admin setting) names the page and the row must be publicly
 * visible right now — draft, scheduled, expired and trashed pages all leave the
 * core landing page in place, the same way a missing one does.
 *
 * This used to be a bare `where('slug', 'home')` lookup, which made `/` flip
 * between the theme and the core landing page whenever that one row was
 * renamed, scheduled, trashed, duplicated or simply not seeded — with no
 * configuration change anywhere.
 */
final class Homepage
{
    public const DEFAULT_SLUG = 'home';

    public function __construct(private readonly SettingRepository $settings) {}

    /**
     * The configured slug, or the schema default when it is missing/invalid.
     */
    public function slug(): string
    {
        $slug = $this->settings->values('content')['homepage_slug'] ?? self::DEFAULT_SLUG;

        if (! is_string($slug) || preg_match('/^[a-z0-9][a-z0-9-]*$/', $slug) !== 1) {
            return self::DEFAULT_SLUG;
        }

        return $slug;
    }

    /**
     * The page that `/` renders, or null when the configured homepage is not
     * publicly visible (draft, scheduled, expired or deleted).
     */
    public function page(?string $slug = null): ?Page
    {
        $slug ??= $this->slug();

        $pages = Page::query()
            ->where('slug', $slug)
            ->orderByDesc('id')
            ->get();

        foreach ($pages as $page) {
            if ($page->isPubliclyVisible()) {
                return $page;
            }
        }

        return null;
    }

    /**
     * True when the given page is the one served at `/`, so links and the
     * sitemap can write `/` instead of `/<slug>`.
     */
    public function isHome(Page $page): bool
    {
        return $page->slug === $this->slug();
    }
}
