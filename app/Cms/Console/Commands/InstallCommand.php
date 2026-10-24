<?php

namespace App\Cms\Console\Commands;

use App\Cms\Addons\AddonManager;
use App\Cms\Registries\Navigation;
use App\Cms\Repositories\AddonRepository;
use App\Cms\Repositories\ThemeRepository;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Throwable;

/**
 * `php artisan lattice:install [--demo]`
 *
 * Migrates the core, then installs (but does not activate) every addon found
 * on disk, links storage and regenerates the frontend registries.
 */
class InstallCommand extends Command
{
    protected $signature = 'lattice:install
        {--demo : Also seed demo content}
        {--force : Run without confirmation in production}';

    protected $description = 'Install Lattice: migrate the core and discover addons and themes';

    public function handle(
        AddonRepository $addons,
        AddonManager $manager,
        ThemeRepository $themes,
        Navigation $navigation,
    ): int {
        if ($this->laravel->isProduction() && ! $this->option('force')
            && ! $this->confirm('You are about to install Lattice in production. Continue?')) {
            return self::FAILURE;
        }

        $this->components->info('Migrating the core schema…');
        Artisan::call('migrate', ['--force' => true], $this->output);

        $this->components->info('Installing addons found on disk…');

        foreach ($addons->discovered() as $manifest) {
            $existing = $addons->find($manifest->handle);

            if ($existing !== null) {
                $this->components->twoColumnDetail($manifest->handle, '<fg=yellow>already installed</>');

                continue;
            }

            try {
                $manager->install($manifest);
                $this->components->twoColumnDetail($manifest->handle, '<fg=green>installed</>');
            } catch (Throwable $e) {
                $this->components->twoColumnDetail($manifest->handle, '<fg=red>'.$e->getMessage().'</>');
            }
        }

        $this->components->info('Registering themes…');
        $this->registerThemes($themes);

        if (! File::exists(public_path('storage'))) {
            Artisan::call('storage:link');
        }

        Artisan::call('lattice:discover', [], $this->output);

        if ($this->option('demo')) {
            Artisan::call('db:seed', ['--force' => true], $this->output);
        }

        $navigation->flush();

        $this->components->info('Lattice is installed. Visit /admin to sign in.');

        return self::SUCCESS;
    }

    /**
     * Themes live on disk too; installing them is only a database row so the
     * appearance screen can list them.
     */
    private function registerThemes(ThemeRepository $themes): void
    {
        foreach ($themes->discovered() as $manifest) {
            if ($themes->find($manifest->handle) !== null) {
                $this->components->twoColumnDetail($manifest->handle, '<fg=yellow>already installed</>');

                continue;
            }

            $themes->install($manifest);
            $this->components->twoColumnDetail($manifest->handle, '<fg=green>installed</>');
        }
    }
}
