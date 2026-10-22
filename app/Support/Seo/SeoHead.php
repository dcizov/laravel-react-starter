<?php

namespace App\Support\Seo;

use App\Features\FeatureRegistry;
use App\Settings\AppSettings;
use App\Support\Sites\CurrentSite;

/**
 * Works out the page title, description, image, canonical link and robots setting for a page.
 *
 * The site-wide defaults come from the SEO settings, and only apply while the seo feature is on. Entries can
 * override them. Used by the landing page, content pages and posts, and the shared head.
 */
final class SeoHead
{
    /**
     * @param  array{title?: string|null, description?: string|null, noindex?: bool|null}|null  $overrides  Per-page settings from the entry.
     * @return array{title: string, description: string|null, image: string|null, canonical: string|null, noindex: bool, site_name: string|null, twitter: string|null}
     */
    public static function for(
        string $title,
        ?string $description = null,
        ?string $image = null,
        ?string $canonical = null,
        ?array $overrides = null,
        ?AppSettings $settings = null,
    ): array {
        $seoOn = app(FeatureRegistry::class)->isEnabled('seo');
        $settings ??= app(AppSettings::class);

        // The default site uses the app's name and SEO settings. Other sites use their own name and description.
        $site = app(CurrentSite::class)->site();
        $siteName = $seoOn ? ($site->isDefault() ? ($settings->app_name ?? null) : $site->name) : null;

        $pageTitle = $overrides['title'] ?? $title;
        $pageDescription = $overrides['description'] ?? $description;

        if ($seoOn) {
            $pageDescription = $pageDescription ?: ($site->isDefault() ? $settings->seo_description : $site->description());
            $image = $image ?: $settings->seo_image;
        }

        $noindex = (bool) ($overrides['noindex'] ?? false);

        if ($seoOn && ! $settings->seo_allow_indexing) {
            $noindex = true;
        }

        return [
            'title' => $seoOn && $siteName && $siteName !== $pageTitle ? $pageTitle.' | '.$siteName : $pageTitle,
            'description' => $pageDescription ? str($pageDescription)->squish()->limit(160)->toString() : null,
            'image' => $image,
            'canonical' => $canonical,
            'noindex' => $noindex,
            'site_name' => $siteName,
            'twitter' => $seoOn ? ($settings->seo_twitter ?: null) : null,
        ];
    }
}
