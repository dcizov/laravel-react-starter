<?php

namespace App\Features\Cms;

use App\Features\Feature;
use App\Support\Rbac;

/**
 * Content management: pages, custom post types with custom fields, reusable call-to-action blocks, taxonomies
 * (categories and tags), trash and revisions, and comment moderation. Blog posts are a content type too, provided
 * by the blog feature.
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
        return [
            Rbac::PERMISSION_CONTENT_VIEW,
            Rbac::PERMISSION_CONTENT_CREATE,
            Rbac::PERMISSION_CONTENT_EDIT_OWN,
            Rbac::PERMISSION_CONTENT_EDIT_ANY,
            Rbac::PERMISSION_CONTENT_PUBLISH,
            Rbac::PERMISSION_CONTENT_DELETE,
            Rbac::PERMISSION_COMMENTS_MODERATE,
        ];
    }

    public static function providers(): array
    {
        return [CmsServiceProvider::class];
    }
}
