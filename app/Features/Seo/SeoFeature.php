<?php

namespace App\Features\Seo;

use App\Features\Feature;
use App\Support\Rbac;

/**
 * Search and sharing settings for the whole site: titles, descriptions, social images, indexing, sitemap and robots.txt.
 * Pages and entries can override these with their own SEO fields.
 */
final class SeoFeature extends Feature
{
    public static function slug(): string
    {
        return 'seo';
    }

    public static function label(): string
    {
        return 'SEO';
    }

    public static function permissions(): array
    {
        return [Rbac::PERMISSION_SEO_MANAGE];
    }

    public static function providers(): array
    {
        return [SeoServiceProvider::class];
    }
}
