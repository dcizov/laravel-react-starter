<?php

namespace App\Features\Blog;

use App\Features\Feature;

/**
 * The blog: posts (a built-in content type) and a public blog with categories and tags. Comments are the cms feature's.
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
        // Comment moderation is part of the cms feature (content.manage), so the blog adds no permission of its own.
        return [];
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
