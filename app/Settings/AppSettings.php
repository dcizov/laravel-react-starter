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

    public static function group(): string
    {
        return 'app';
    }
}
