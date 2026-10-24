<?php

namespace App\Cms\Console\Commands\Addon;

use App\Cms\Addons\AddonManager;

class DisableAddonCommand extends AddonCommand
{
    protected $signature = 'addon:disable {handle : Addon handle}';

    protected $description = 'Stop booting the addon, keeping its data';

    protected function action(): string
    {
        return 'disabled';
    }

    protected function perform(string $handle): void
    {
        $this->laravel->make(AddonManager::class)->deactivate($handle);
    }
}
