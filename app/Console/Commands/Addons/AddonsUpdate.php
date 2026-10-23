<?php

namespace App\Console\Commands\Addons;

use App\Addons\AddonLifecycle;
use App\Addons\Exceptions\AddonException;
use Illuminate\Console\Command;

class AddonsUpdate extends Command
{
    protected $signature = 'addons:update {slug : The slug of an installed addon} {--dry-run : Show the changes and change nothing} {--allow-tables : Accept a changed set of declared tables} {--force : Accept a version lower than the recorded one}';

    protected $description = 'Accept a changed addon.json for an installed addon, and record its new version and checksum';

    public function handle(AddonLifecycle $lifecycle): int
    {
        $slug = $this->argument('slug');
        $slug = is_string($slug) ? $slug : '';

        try {
            $result = $lifecycle->update(
                $slug,
                dryRun: (bool) $this->option('dry-run'),
                allowTables: (bool) $this->option('allow-tables'),
                force: (bool) $this->option('force'),
            );
        } catch (AddonException $e) {
            $this->error('The addon was not updated: '.$e->getMessage());

            return self::FAILURE;
        }

        if ($result->unchanged) {
            $this->info("[{$slug}] is already up to date at version {$result->addon->version}. Nothing was changed.");

            return self::SUCCESS;
        }

        $this->line("Changes for [{$slug}], from {$result->fromVersion} to {$result->manifest->version}:");

        foreach ($result->changes as $change) {
            $this->line('  - '.$change);
        }

        if (! $result->applied) {
            $this->info('Dry run: nothing was changed. Run again without --dry-run to apply these changes.');

            return self::SUCCESS;
        }

        $this->info("Updated [{$slug}] to version {$result->manifest->version}.");
        $this->line('Run php artisan route:cache if you use route caching, then php artisan addons:list --check.');

        return self::SUCCESS;
    }
}
