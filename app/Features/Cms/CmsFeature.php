<?php

namespace App\Features\Cms;

use App\Features\Feature;
use App\Support\Rbac;

/**
 * Content management: pages, custom post types with custom fields, reusable call-to-action blocks, and
 * taxonomies (categories and tags). Blog posts are a content type too, provided by the blog feature.
 */
final class CmsFeature extends Feature
{
    public static function slug(): string
    {
        return 'cms';
    }

    public static function label(): string
    {
        return 'Content (CMS)';
    }

    public static function permissions(): array
    {
        return [Rbac::PERMISSION_CONTENT_MANAGE];
    }

    public static function providers(): array
    {
        return [CmsServiceProvider::class];
    }
}
