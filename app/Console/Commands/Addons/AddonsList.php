<?php

namespace App\Console\Commands\Addons;

use App\Addons\AddonCompiler;
use App\Addons\AddonStore;
use App\Addons\Discovery\AddonDiscovery;
use Illuminate\Console\Command;

class AddonsList extends Command
{
    protected $signature = 'addons:list {--check : Exit with an error if the compiled manifest is out of date or an addon folder changed}';

    protected $description = 'List the installed addons, their status, and whether the compiled manifest is up to date';

    public function handle(AddonCompiler $compiler, AddonDiscovery $discovery): int
    {
        $rows = AddonStore::rows();

        if ($rows->isEmpty()) {
            $this->line('No addons are installed.');
        } else {
            $table = [];

            foreach ($rows as $addon) {
                $table[] = [
                    $addon->slug,
                    $addon->version,
                    $addon->status,
                    $addon->enabled ? 'yes' : 'no',
                    $addon->path,
                ];
            }

            $this->table(['Slug', 'Version', 'Status', 'Enabled', 'Path'], $table);
        }

        $discovered = $discovery->discover();

        foreach ($discovered->errors as $file => $messages) {
            foreach ($messages as $message) {
                $this->warn("{$file}: {$message}");
            }
        }

        $problems = $compiler->problems();

        if ($problems === []) {
            $this->info('The compiled manifest is up to date.');

            return self::SUCCESS;
        }

        foreach ($problems as $problem) {
            $this->warn($problem);
        }

        if ($this->option('check')) {
            $this->error('The addon state is stale. Run php artisan addons:compile, then check again.');

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
