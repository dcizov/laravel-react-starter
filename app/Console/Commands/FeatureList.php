<?php

namespace App\Console\Commands;

use App\Features\FeatureRegistry;
use Illuminate\Console\Command;

class FeatureList extends Command
{
    protected $signature = 'feature:list';

    protected $description = 'List the features that are available and whether each one is enabled';

    public function handle(FeatureRegistry $registry): int
    {
        $enabled = $registry->enabled();
        $rows = [];

        foreach ($registry->available() as $slug => $class) {
            $rows[] = [
                $slug,
                $class::label(),
                in_array($slug, $enabled, true) ? 'enabled' : 'disabled',
                implode(', ', $class::dependsOn()) ?: '-',
            ];
        }

        $this->table(['Slug', 'Name', 'Status', 'Needs'], $rows);

        return self::SUCCESS;
    }
}
