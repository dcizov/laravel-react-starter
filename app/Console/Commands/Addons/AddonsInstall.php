<?php

namespace App\Console\Commands\Addons;

use App\Addons\AddonLifecycle;
use App\Addons\Exceptions\AddonException;
use Illuminate\Console\Command;

class AddonsInstall extends Command
{
    protected $signature = 'addons:install {slug : The slug of an addon in the addon folders}';

    protected $description = 'Install an addon. It stays switched off until addons:activate runs';

    public function handle(AddonLifecycle $lifecycle): int
    {
        try {
            $addon = $lifecycle->install((string) $this->argument('slug'));
        } catch (AddonException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info("Installed [{$addon->slug}] version {$addon->version}. Run php artisan addons:activate {$addon->slug} to switch it on.");

        return self::SUCCESS;
    }
}
