<?php

namespace App\Console\Commands;

use App\Features\FeatureManager;
use Illuminate\Console\Command;
use InvalidArgumentException;
use RuntimeException;

class FeatureDisable extends Command
{
    protected $signature = 'feature:disable {feature : The feature slug, for example newsletter}';

    protected $description = 'Switch a feature off: removes it from FEATURES in .env. Its data is kept';

    public function handle(FeatureManager $manager): int
    {
        try {
            $manager->disable((string) $this->argument('feature'));
        } catch (InvalidArgumentException|RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info("Feature [{$this->argument('feature')}] is disabled. Its tables and data were kept.");
        $this->line('Rebuild the frontend so its pages are removed: npm run build');

        return self::SUCCESS;
    }
}
