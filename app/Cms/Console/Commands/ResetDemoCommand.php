<?php

namespace App\Cms\Console\Commands;

use Database\Seeders\DemoSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

/**
 * `php artisan lattice:reset-demo`
 *
 * Drops everything, migrates again and re-seeds the demo site. Intended for a
 * local checkout: it destroys data by design, so it asks first unless
 * `--force` is passed (which is what the QA script and CI use).
 */
class ResetDemoCommand extends Command
{
    protected $signature = 'lattice:reset-demo {--force : Do not ask for confirmation}';

    protected $description = 'Rebuild the demo site from scratch (destroys all data)';

    public function handle(): int
    {
        if (! $this->option('force') && ! $this->confirm('This drops every table and seeds the demo site again. Continue?')) {
            $this->components->warn('Nothing was changed.');

            return self::FAILURE;
        }

        $this->components->task('Dropping and migrating', fn (): int => Artisan::call('migrate:fresh', ['--force' => true]));
        $this->components->task('Seeding the demo', fn (): int => Artisan::call('db:seed', ['--class' => DemoSeeder::class, '--force' => true]));
        $this->components->task('Regenerating the frontend registries', fn (): int => Artisan::call('lattice:discover'));

        $this->components->info('The demo site is ready. Sign in at /admin with admin@lattice.test / password.');

        return self::SUCCESS;
    }
}
