<?php

namespace App\Console\Commands\Addons;

use App\Addons\AddonCompiler;
use App\Addons\Exceptions\AddonException;
use Illuminate\Console\Command;

class AddonsCompile extends Command
{
    protected $signature = 'addons:compile';

    protected $description = 'Write the compiled addon manifest that the app reads at boot';

    public function handle(AddonCompiler $compiler): int
    {
        try {
            $payload = $compiler->compile();
        } catch (AddonException $e) {
            $this->error('The compiled manifest was not written: '.$e->getMessage());

            return self::FAILURE;
        }

        $enabled = count(array_filter($payload['addons'], fn (array $addon): bool => $addon['enabled'] === true));

        $this->info(sprintf(
            'Compiled %d installed addon(s), %d enabled. Config and route caches need rebuilding if they are in use: php artisan route:cache.',
            count($payload['addons']),
            $enabled,
        ));

        return self::SUCCESS;
    }
}
