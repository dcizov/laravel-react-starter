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

    /**
     * Show the landing page at the home URL. When off, guests go to login and users to the dashboard.
     */
    public bool $landing_enabled;

    // The landing page blocks being edited. Null means never saved, so the published page is used.
    // Plain comments, not a docblock: Spatie reads @var tags to pick the cast, and it cannot parse
    // array shapes such as array{id: string}.
    public ?array $landing_draft;

    // The landing page blocks visitors see. Null means never published, so the built-in default page is used.
    // An empty list is a deliberately empty page.
    public ?array $landing_published;

    // The page theme being edited, and the theme visitors see. Null means never saved, so the default theme is used.
    // Stored as the same fields as the blocks: primary, background, foreground, radius, font, and text_size.
    public ?array $landing_theme_draft;

    public ?array $landing_theme;

    public static function group(): string
    {
        return 'app';
    }
}
