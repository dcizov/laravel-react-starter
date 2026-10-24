<?php

declare(strict_types=1);

namespace App\Cms\Console\Commands;

use App\Cms\Themes\ThemeManager;
use Illuminate\Console\Command;
use Throwable;

/**
 * `php artisan theme:activate meridian`
 *
 * Activation checks the manifest's requirements, writes `is_active`, flushes
 * the theme cache and reloads the provider. Content is never touched.
 */
class ActivateThemeCommand extends Command
{
    protected $signature = 'theme:activate {handle : Theme handle}';

    protected $description = 'Switch the public site to another installed theme';

    public function handle(ThemeManager $themes): int
    {
        $handle = (string) $this->argument('handle');

        try {
            $manifest = $themes->activate($handle);
        } catch (Throwable $e) {
            $this->components->error($e->getMessage());

            return self::FAILURE;
        }

        $this->components->info("Theme [{$manifest->handle}] is now rendering the public site.");
        $this->line('Sign in to /admin/appearance to see the token set, or reload the site.');

        return self::SUCCESS;
    }
}
