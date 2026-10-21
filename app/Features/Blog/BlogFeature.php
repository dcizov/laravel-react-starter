<?php

namespace App\Features\Blog;

use App\Features\Feature;
use App\Support\Rbac;

/**
 * The blog: posts (a built-in content type), a public blog with categories and tags, and comments with moderation.
 */
final class BlogFeature extends Feature
{
    public static function slug(): string
    {
        return 'blog';
    }

    public static function label(): string
    {
        return 'Blog and comments';
    }

    public static function permissions(): array
    {
        return [Rbac::PERMISSION_BLOG_MANAGE];
    }

    public static function dependsOn(): array
    {
        return ['cms'];
    }

    public static function providers(): array
    {
        return [BlogServiceProvider::class];
    }
}
