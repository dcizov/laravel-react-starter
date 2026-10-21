<?php

namespace App\Console\Commands;

use App\Features\FeatureManager;
use Illuminate\Console\Command;
use InvalidArgumentException;
use RuntimeException;

class FeatureEnable extends Command
{
    protected $signature = 'feature:enable {feature : The feature slug, for example landing} {--no-migrate : Do not run the feature migrations}';

    protected $description = 'Switch a feature on: adds it to FEATURES in .env and runs its migrations';

    public function handle(FeatureManager $manager): int
    {
        try {
            $manager->enable((string) $this->argument('feature'), ! $this->option('no-migrate'));
        } catch (InvalidArgumentException|RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info("Feature [{$this->argument('feature')}] is enabled.");
        $this->line('Rebuild the frontend so its pages are included: npm run build');

        return self::SUCCESS;
    }
}
