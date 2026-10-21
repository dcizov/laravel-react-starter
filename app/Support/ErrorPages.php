<?php

namespace App\Support;

use App\Settings\AppSettings;
use Throwable;

/**
 * Decides whether the app's own error pages are shown.
 *
 * This reads the admin setting. It runs while an exception is being rendered, so if the settings
 * cannot be read (for example the database is down, or the migration has not run yet), it uses the
 * CUSTOM_ERROR_PAGES value from .env instead of failing again.
 *
 * Debug mode is not controlled here. It stays in APP_DEBUG, because turning it on from an admin
 * page would expose stack traces and configuration to anyone who could reach that page.
 */
final class ErrorPages
{
    public static function enabled(): bool
    {
        try {
            return app(AppSettings::class)->custom_error_pages;
        } catch (Throwable) {
            return (bool) config('app.custom_error_pages', true);
        }
    }
}
