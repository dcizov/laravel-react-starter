<?php

namespace App\Addons;

use App\Addons\Discovery\AddonDiscovery;
use App\Addons\Exceptions\AddonException;
use App\Addons\Exceptions\AddonLifecycleException;
use App\Addons\Manifest\AddonManifest;
use App\Models\Addon;
use App\Models\AddonMigration;
use App\Models\AuditLog;
use App\Support\Rbac;
use Closure;
use Composer\Semver\Semver;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Throwable;

/**
 * Installs, activates and deactivates addons.
 *
 * Every operation holds one lock, keeps a copy of the compiled manifest first, and restores that copy if it fails.
 * Install and deactivate change the database and the manifest in one transaction. Activation runs migrations in
 * their own transactions, so an activation that fails part way keeps the migrations that finished and can be
 * retried. Nothing here removes code or data. Removal and purge belong to a later phase.
 */
final class AddonLifecycle
{
    private const LOCK_NAME = 'addons:lifecycle';

    private const LOCK_SECONDS = 300;

    public function __construct(
        private readonly AddonDiscovery $discovery,
        private readonly AddonCompiler $compiler,
        private readonly AddonMigrator $migrator,
        private readonly AddonRegistry $registry,
    ) {}

    /**
     * Make an addon's code known to the app. It stays switched off until it is activated.
     *
     * @throws AddonException
     */
    public function install(string $slug): Addon
    {
        return $this->operate($slug, 'install', function () use ($slug): Addon {
            if (Addon::query()->where('slug', $slug)->exists()) {
                throw new AddonLifecycleException("Addon [{$slug}] is already installed.");
            }

            $manifest = $this->discoveredManifest($slug);
            $this->assertDependencies($manifest, activeRequired: false);

            return DB::transaction(function () use ($manifest): Addon {
                $addon = Addon::query()->create([
                    'slug' => $manifest->slug,
                    'name' => $manifest->name,
                    'version' => $manifest->version,
                    'status' => Addon::STATUS_INSTALLED,
                    'enabled' => false,
                    'path' => $manifest->directory,
                    'manifest_checksum' => $manifest->checksum,
                    'installed_at' => now(),
                ]);

                $this->compiler->compile();

                AuditLog::record('addon.installed', null, ['addon' => $manifest->slug, 'version' => $manifest->version]);

                return $addon;
            });
        });
    }

    /**
     * Switch an installed addon on: run its pending migrations, sync its permissions, and recompile the manifest.
     *
     * @throws AddonException
     */
    public function activate(string $slug): Addon
    {
        return $this->operate($slug, 'activate', function () use ($slug): Addon {
            $addon = $this->installed($slug);

            if ($addon->status === Addon::STATUS_ACTIVE) {
                throw new AddonLifecycleException("Addon [{$slug}] is already active.");
            }

            $manifest = $this->installedManifest($addon);
            $this->assertDependencies($manifest, activeRequired: true);
            $this->assertTablesAvailable($manifest);

            try {
                $this->migrator->migrate($manifest);

                return DB::transaction(function () use ($addon, $manifest): Addon {
                    $addon->forceFill([
                        'status' => Addon::STATUS_ACTIVE,
                        'enabled' => true,
                        'activated_at' => now(),
                        'last_error' => null,
                    ])->save();

                    $this->compiler->compile();
                    Rbac::syncFeaturePermissions();

                    AuditLog::record('addon.activated', null, ['addon' => $manifest->slug, 'version' => $manifest->version]);

                    return $addon;
                });
            } catch (Throwable $e) {
                $this->markFailed($addon, $e);

                throw new AddonLifecycleException("Could not activate [{$slug}]. {$e->getMessage()}", 0, $e);
            }
        });
    }

    /**
     * Switch an addon off. Its code, tables and data are kept, its permissions are taken away from every role,
     * and its migrations are not reversed.
     *
     * @throws AddonException
     */
    public function deactivate(string $slug): Addon
    {
        return $this->operate($slug, 'deactivate', function () use ($slug): Addon {
            $addon = $this->installed($slug);

            if (! in_array($addon->status, [Addon::STATUS_ACTIVE, Addon::STATUS_FAILED], true)) {
                throw new AddonLifecycleException("Addon [{$slug}] is not active.");
            }

            $dependents = $this->activeDependents($slug);

            if ($dependents !== []) {
                throw new AddonLifecycleException(
                    "Addon [{$slug}] cannot be deactivated while these active addons depend on it: ".implode(', ', $dependents).'. Deactivate them first.',
                );
            }

            return DB::transaction(function () use ($addon, $slug): Addon {
                $addon->forceFill([
                    'status' => Addon::STATUS_INACTIVE,
                    'enabled' => false,
                    'deactivated_at' => now(),
                    'last_error' => null,
                ])->save();

                $this->revokePermissions($slug);
                $this->compiler->compile();
                Rbac::syncFeaturePermissions();

                AuditLog::record('addon.deactivated', null, ['addon' => $slug]);

                return $addon;
            });
        });
    }

    /**
     * Run one operation under the lock. If it fails, the manifest is restored and the failure is audited.
     *
     * @param  Closure(): Addon  $work
     *
     * @throws AddonException
     */
    private function operate(string $slug, string $action, Closure $work): Addon
    {
        $lock = Cache::lock(self::LOCK_NAME, self::LOCK_SECONDS);

        if (! $lock->get()) {
            throw new AddonLifecycleException('Another addon operation is running. Wait for it to finish, then try again.');
        }

        try {
            $this->compiler->snapshot();

            try {
                return $work();
            } catch (Throwable $e) {
                $this->compiler->restore();

                rescue(fn () => AuditLog::record('addon.failed', null, [
                    'addon' => $slug,
                    'action' => $action,
                    'error' => Str::limit($e->getMessage(), 500),
                ]));

                throw $e;
            }
        } finally {
            $lock->release();
        }
    }

    private function installed(string $slug): Addon
    {
        $addon = Addon::query()->where('slug', $slug)->first();

        if ($addon === null) {
            throw new AddonLifecycleException("Addon [{$slug}] is not installed. Run php artisan addons:install {$slug} first.");
        }

        return $addon;
    }

    /**
     * The addon as discovery reads it now, for installing. Its problems are reported when it is not valid.
     */
    private function discoveredManifest(string $slug): AddonManifest
    {
        $result = $this->discovery->discover();

        if (isset($result->manifests[$slug])) {
            return $result->manifests[$slug];
        }

        $problems = $result->errorsFor($slug);

        if ($problems !== []) {
            throw new AddonLifecycleException("Addon [{$slug}] is not valid. ".implode(' ', $problems));
        }

        throw new AddonLifecycleException("Addon [{$slug}] was not found in the addon folders.");
    }

    /**
     * The manifest of an installed addon. Its checksum must still match the one recorded at install.
     *
     * @throws AddonException
     */
    private function installedManifest(Addon $addon): AddonManifest
    {
        return $this->discovery->readManifest($addon->path.'/addon.json', $addon->manifest_checksum);
    }

    /**
     * @param  bool  $activeRequired  Whether each dependency must already be active, not just installed.
     *
     * @throws AddonLifecycleException
     */
    private function assertDependencies(AddonManifest $manifest, bool $activeRequired): void
    {
        foreach ($manifest->requires as $dependency => $constraint) {
            $addon = Addon::query()->where('slug', $dependency)->first();

            if ($addon === null) {
                throw new AddonLifecycleException("[{$manifest->slug}] requires [{$dependency}] {$constraint}, which is not installed.");
            }

            if (! Semver::satisfies($addon->version, $constraint)) {
                throw new AddonLifecycleException("[{$manifest->slug}] requires [{$dependency}] {$constraint}, but version {$addon->version} is installed.");
            }

            if ($activeRequired && $addon->status !== Addon::STATUS_ACTIVE) {
                throw new AddonLifecycleException("[{$manifest->slug}] requires [{$dependency}] to be active first.");
            }
        }
    }

    /**
     * A table that already exists but is not recorded as this addon's would be taken over by its migrations. Refuse.
     *
     * @throws AddonLifecycleException
     */
    private function assertTablesAvailable(AddonManifest $manifest): void
    {
        if (AddonMigration::query()->where('addon_slug', $manifest->slug)->exists()) {
            return;
        }

        foreach ($manifest->tables as $table) {
            if (Schema::hasTable($table)) {
                throw new AddonLifecycleException("The table [{$table}] already exists and is not managed by [{$manifest->slug}]. Rename the table in the addon, or remove it by hand.");
            }
        }
    }

    /**
     * The active addons that require this one.
     *
     * @return list<string>
     */
    private function activeDependents(string $slug): array
    {
        $dependents = [];

        foreach ($this->registry->active() as $other => $entry) {
            $requires = is_array($entry['requires'] ?? null) ? $entry['requires'] : [];

            if ((string) $other !== $slug && array_key_exists($slug, $requires)) {
                $dependents[] = (string) $other;
            }
        }

        return $dependents;
    }

    /**
     * Take the addon's permissions away from every role and from every user who was granted one directly. Its
     * permission rows are kept, so a later activation finds them again. Permissions are named "{slug}.{action}",
     * and the validator keeps those names unique.
     */
    private function revokePermissions(string $slug): void
    {
        Permission::query()
            ->where('name', 'like', $slug.'.%')
            ->get()
            ->each(function (Permission $permission): void {
                $permission->roles()->detach();
                $permission->users()->detach();
            });

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Record a failed activation on the addon: its status, the error, and that it is switched off.
     */
    private function markFailed(Addon $addon, Throwable $error): void
    {
        $addon->refresh();
        $addon->forceFill([
            'status' => Addon::STATUS_FAILED,
            'enabled' => false,
            'last_error' => Str::limit('[activate] '.$error->getMessage(), 2000),
        ])->save();
    }
}
