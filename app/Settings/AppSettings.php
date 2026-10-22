<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

/**
 * App-wide settings an admin can change on the Admin settings page.
 */
class AppSettings extends Settings
{
    public string $app_name;

    /**
     * The role given to every new account.
     */
    public string $default_role;

    /**
     * The path of the logo on the public disk, or null to show the default mark.
     */
    public ?string $app_logo_path;

    /**
     * Show the app's own error pages (401, 403, 404, 500, 503). When off, Laravel's pages are used.
     */
    public bool $custom_error_pages;

    // The landing page blocks being edited. Null means never saved, so the published page is used.
    // Spatie reads @var tags to pick the cast, so these types use @phpstan-var, which only PHPStan reads.
    /** @phpstan-var list<array{id: string, type: string, data: array<string, mixed>}>|null */
    public ?array $landing_draft;

    // The landing page blocks visitors see. Null means never published, so the built-in default page is used.
    // An empty list is a deliberately empty page.
    /** @phpstan-var list<array{id: string, type: string, data: array<string, mixed>}>|null */
    public ?array $landing_published;

    // The page theme being edited, and the theme visitors see. Null means never saved, so the default theme is used.
    // Stored as the same fields as the blocks: primary, background, foreground, radius, font, and text_size.
    /** @phpstan-var array<string, mixed>|null */
    public ?array $landing_theme_draft;

    /** @phpstan-var array<string, mixed>|null */
    public ?array $landing_theme;

    // SEO settings, used while the seo feature is on. The description and image are the defaults for pages
    // that do not set their own. Indexing off adds noindex to every page and disallows crawlers in robots.txt.
    public ?string $seo_description;

    public ?string $seo_image;

    public bool $seo_allow_indexing;

    public ?string $seo_twitter;

    public static function group(): string
    {
        return 'app';
    }
}
