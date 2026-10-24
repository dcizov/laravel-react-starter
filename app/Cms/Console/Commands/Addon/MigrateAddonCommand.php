<?php

declare(strict_types=1);

namespace App\Cms\Console\Commands\Addon;

use App\Cms\Addons\AddonManager;

class MigrateAddonCommand extends AddonCommand
{
    protected $signature = 'addon:migrate {handle : Addon handle}';

    protected $description = 'Run the pending migrations of an addon';

    protected function action(): string
    {
        return 'migrated';
    }

    protected function perform(string $handle): void
    {
        $this->laravel->make(AddonManager::class)->migrate($handle);
    }
}
