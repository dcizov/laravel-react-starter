<?php

namespace App\Addons;

use App\Addons\Exceptions\AddonLifecycleException;
use App\Addons\Manifest\AddonManifest;
use App\Models\AddonMigration;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Runs the migrations of an addon that have not run yet. Each migration runs in its own transaction together with
 * its record in addon_migrations, so a failure leaves that migration undone and the finished ones recorded.
 *
 * PostgreSQL, the production database, rolls back DDL with the transaction. Other databases may not, so addon
 * migrations should be written to be safe to run again after a partial failure.
 */
final class AddonMigrator
{
    /**
     * @return list<string> The migrations that ran now, in order.
     *
     * @throws AddonLifecycleException
     */
    public function migrate(AddonManifest $manifest): array
    {
        $applied = AddonMigration::query()->where('addon_slug', $manifest->slug)->pluck('migration')->all();
        $batch = (int) AddonMigration::query()->where('addon_slug', $manifest->slug)->max('batch') + 1;
        $ran = [];

        foreach ($this->files($manifest) as $name => $file) {
            if (in_array($name, $applied, true)) {
                continue;
            }

            $migration = require $file;

            if (! $migration instanceof Migration) {
                throw new AddonLifecycleException("Migration {$name} of [{$manifest->slug}] must return a migration object.");
            }

            try {
                DB::transaction(function () use ($migration, $manifest, $name, $batch): void {
                    $migration->up();

                    AddonMigration::query()->create([
                        'addon_slug' => $manifest->slug,
                        'migration' => $name,
                        'batch' => $batch,
                        'applied_at' => now(),
                    ]);
                });
            } catch (Throwable $e) {
                throw new AddonLifecycleException("Migration {$name} of [{$manifest->slug}] failed: {$e->getMessage()}", 0, $e);
            }

            $ran[] = $name;
        }

        foreach ($manifest->tables as $table) {
            if (! Schema::hasTable($table)) {
                throw new AddonLifecycleException("The table [{$table}] declared by [{$manifest->slug}] does not exist after its migrations ran.");
            }
        }

        return $ran;
    }

    /**
     * @return array<string, string> Migration name => file, in the order they run.
     */
    private function files(AddonManifest $manifest): array
    {
        if ($manifest->migrations === null || ! is_dir($manifest->migrations)) {
            return [];
        }

        $files = glob($manifest->migrations.'/*.php') ?: [];
        sort($files);

        $ordered = [];

        foreach ($files as $file) {
            $ordered[basename($file, '.php')] = $file;
        }

        return $ordered;
    }
}
