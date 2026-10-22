<?php

namespace App\Console\Commands\Addons;

use App\Addons\AddonLifecycle;
use App\Addons\Exceptions\AddonException;
use Illuminate\Console\Command;

class AddonsActivate extends Command
{
    protected $signature = 'addons:activate {slug : The slug of an installed addon} {--adopt : Record the migrations as run, for tables that already exist, instead of running them}';

    protected $description = 'Activate an installed addon: run its pending migrations, sync its permissions and switch it on';

    public function handle(AddonLifecycle $lifecycle): int
    {
        try {
            $slug = $this->argument('slug');
            $addon = $lifecycle->activate(is_string($slug) ? $slug : '', (bool) $this->option('adopt'));
        } catch (AddonException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info("Activated [{$addon->slug}]. Run php artisan route:cache again if you use route caching.");

        return self::SUCCESS;
    }
}
