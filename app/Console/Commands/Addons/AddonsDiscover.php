<?php

namespace App\Console\Commands\Addons;

use App\Addons\Discovery\AddonDiscovery;
use Illuminate\Console\Command;

class AddonsDiscover extends Command
{
    protected $signature = 'addons:discover';

    protected $description = 'Find the addons in the addon folders and check their addon.json files, without changing anything';

    public function handle(AddonDiscovery $discovery): int
    {
        $result = $discovery->discover();

        if ($result->manifests !== []) {
            $rows = [];

            foreach ($result->manifests as $manifest) {
                $rows[] = [$manifest->slug, $manifest->version, $manifest->core, $manifest->directory];
            }

            $this->table(['Slug', 'Version', 'Core', 'Path'], $rows);
        } else {
            $this->line('No valid addons were found.');
        }

        if (! $result->hasErrors()) {
            $this->info('All addon.json files are valid.');

            return self::SUCCESS;
        }

        $this->error('Problems were found in the following addon.json files:');

        foreach ($result->errors as $file => $messages) {
            $this->line($file);

            foreach ($messages as $message) {
                $this->line('  - '.$message);
            }
        }

        return self::FAILURE;
    }
}
