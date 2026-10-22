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
        $feature = $this->argument('feature');

        // The argument is required, so this only guards the type. It is always a slug from the command line.
        if (! is_string($feature)) {
            $this->error('The feature slug must be text.');

            return self::FAILURE;
        }

        try {
            $manager->disable($feature);
        } catch (InvalidArgumentException|RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info("Feature [{$feature}] is disabled. Its tables and data were kept.");
        $this->line('Rebuild the frontend so its pages are removed: npm run build');

        return self::SUCCESS;
    }
}
