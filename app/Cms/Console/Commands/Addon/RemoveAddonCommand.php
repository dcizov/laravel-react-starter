<?php

namespace App\Cms\Console\Commands\Addon;

use App\Cms\Addons\AddonManager;

class RemoveAddonCommand extends AddonCommand
{
    protected $signature = 'addon:remove
        {handle : Addon handle}
        {--keep-data : Roll back nothing and leave the addon tables in place}
        {--keep-files : Keep the addon folder on disk}';

    protected $description = 'Remove an addon and, unless --keep-data is passed, its tables';

    protected function action(): string
    {
        return 'removed';
    }

    protected function perform(string $handle): void
    {
        $this->laravel->make(AddonManager::class)->uninstall(
            $handle,
            deleteData: ! $this->option('keep-data'),
            deleteFiles: ! $this->option('keep-files'),
        );
    }
}
