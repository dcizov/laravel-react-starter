<?php

namespace App\Console\Commands\Addons;

use App\Addons\AddonLifecycle;
use App\Addons\Exceptions\AddonException;
use Illuminate\Console\Command;

class AddonsDeactivate extends Command
{
    protected $signature = 'addons:deactivate {slug : The slug of an active addon}';

    protected $description = 'Deactivate an addon. Its code, tables and data are kept, and its migrations are not reversed';

    public function handle(AddonLifecycle $lifecycle): int
    {
        try {
            $addon = $lifecycle->deactivate((string) $this->argument('slug'));
        } catch (AddonException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info("Deactivated [{$addon->slug}]. Its code, tables and data were kept. Its permissions were removed from every role.");

        return self::SUCCESS;
    }
}
