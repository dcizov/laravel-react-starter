<?php

declare(strict_types=1);

namespace App\Cms\Console\Commands\Addon;

use App\Cms\Addons\AddonManager;

class EnableAddonCommand extends AddonCommand
{
    protected $signature = 'addon:enable {handle : Addon handle}';

    protected $description = 'Install migrations, run the activation hook and boot the addon';

    protected function action(): string
    {
        return 'enabled';
    }

    protected function perform(string $handle): void
    {
        $this->laravel->make(AddonManager::class)->activate($handle);
    }
}
