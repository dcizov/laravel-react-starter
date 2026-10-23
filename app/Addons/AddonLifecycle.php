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
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
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
        private readonly Router $router,
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

            $addon = DB::transaction(function () use ($manifest): Addon {
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

            // Installing changes the route set. Register the new routes in this process, and drop a route cache that
            // was built without them, so the next boot registers them.
            AddonRouteLoader::register($this->router, $this->registry);
            $this->forgetStaleRouteCache();

            return $addon;
        });
    }

    /**
     * Switch an installed addon on: run its pending migrations, sync its permissions, and recompile the manifest.
     *
     * With $adopt, the addon's tables must already exist. Its migrations are recorded as run and are not executed.
     * Use it once for an addon that took over tables an existing installation already has.
     *
     * @throws AddonException
     */
    public function activate(string $slug, bool $adopt = false): Addon
    {
        return $this->operate($slug, 'activate', function () use ($slug, $adopt): Addon {
            $addon = $this->installed($slug);

            if ($addon->status === Addon::STATUS_ACTIVE) {
                throw new AddonLifecycleException("Addon [{$slug}] is already active.");
            }

            $manifest = $this->installedManifest($addon);
            $this->assertDependencies($manifest, activeRequired: true);

            // Both checks run before anything changes, so a refused activation leaves the addon as it was.
            if ($adopt) {
                $this->assertTablesExist($manifest);
            } else {
                $this->assertTablesAvailable($manifest);
            }

            try {
                if ($adopt) {
                    $this->migrator->adopt($manifest);
                } else {
                    $this->migrator->migrate($manifest);
                }

                return DB::transaction(function () use ($addon, $manifest, $adopt): Addon {
                    $addon->forceFill([
                        'status' => Addon::STATUS_ACTIVE,
                        'enabled' => true,
                        'activated_at' => now(),
                        'last_error' => null,
                    ])->save();

                    $this->compiler->compile();
                    Rbac::syncFeaturePermissions();

                    AuditLog::record('addon.activated', null, ['addon' => $manifest->slug, 'version' => $manifest->version, 'adopted' => $adopt]);

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
     * @template T
     *
     * @param  Closure(): T  $work
     * @return T
     *
     * @throws AddonException
     */
    private function operate(string $slug, string $action, Closure $work)
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

                if ($e instanceof AddonException) {
                    throw $e;
                }

                // Anything else (a failing listener, the filesystem, the database) reaches the caller as a lifecycle
                // error, so the command prints it instead of a stack trace. The original stays as the previous exception.
                throw new AddonLifecycleException("Could not {$action} [{$slug}]. {$e->getMessage()}", 0, $e);
            }
        } finally {
            $lock->release();
        }
    }

    /**
     * Accept a changed addon.json for an installed addon: record its new version and checksum, run its pending
     * migrations if it is active, sync permissions, and recompile. A dry run returns the same plan and changes
     * nothing. Running it again with nothing changed does nothing.
     *
     * Declared tables and package names are not changed by a routine update: a changed table set needs
     * $allowTables, a changed package name is refused. A version lower than the recorded one needs $force.
     *
     * @throws AddonException
     */
    public function update(string $slug, bool $dryRun = false, bool $allowTables = false, bool $force = false): AddonUpdate
    {
        $plan = $this->planUpdate($slug, $allowTables, $force);

        if ($plan->unchanged || $dryRun) {
            return $plan;
        }

        return $this->operate($slug, 'update', function () use ($slug, $allowTables, $force): AddonUpdate {
            // Planned again under the lock, so a change made since the first look is seen.
            $plan = $this->planUpdate($slug, $allowTables, $force);

            if ($plan->unchanged) {
                return $plan;
            }

            $addon = $plan->addon;
            $manifest = $plan->manifest;

            // Migrations run before the new checksum is recorded, as activation does. If they fail, the old record stays,
            // so the addon still reads as drifted until the problem is fixed.
            if ($addon->status === Addon::STATUS_ACTIVE) {
                $this->migrator->migrate($manifest);
            }

            DB::transaction(function () use ($addon, $manifest, $plan, $slug): void {
                $addon->forceFill([
                    'version' => $manifest->version,
                    'manifest_checksum' => $manifest->checksum,
                ])->save();

                $this->compiler->compile();
                Rbac::syncFeaturePermissions();

                AuditLog::record('addon.updated', null, [
                    'addon' => $slug,
                    'from' => $plan->fromVersion,
                    'to' => $manifest->version,
                    'changes' => $plan->changes,
                    'downgrade' => $plan->downgrade,
                ]);
            });

            $this->forgetStaleRouteCache();

            return new AddonUpdate($addon, $manifest, $plan->fromVersion, $plan->changes, unchanged: false, downgrade: $plan->downgrade, applied: true);
        });
    }

    /**
     * Read addon.json as it is now, and decide whether it is an update. Writes nothing.
     *
     * @throws AddonException
     */
    private function planUpdate(string $slug, bool $allowTables, bool $force): AddonUpdate
    {
        $addon = $this->installed($slug);

        // Validated like a fresh read. An invalid file is refused before anything is recorded.
        $manifest = $this->discovery->readManifest($addon->path.'/addon.json');

        if ($manifest->slug !== $addon->slug) {
            throw new AddonLifecycleException("addon.json names [{$manifest->slug}], but the installed addon is [{$addon->slug}]. That is not an update, so it is refused.");
        }

        if ($manifest->name !== $addon->name) {
            throw new AddonLifecycleException("The package name changed from [{$addon->name}] to [{$manifest->name}]. That is not an update, so it is refused. Restore the installed name.");
        }

        $recorded = $this->compiler->recordedEntry($slug);

        if ($manifest->version === $addon->version && $manifest->checksum === $addon->manifest_checksum) {
            return new AddonUpdate($addon, $manifest, $addon->version, [], unchanged: true, downgrade: false);
        }

        $changes = $this->changesFrom($recorded, $manifest);

        $tablesChanged = $this->tablesChanged($recorded, $manifest);

        if ($tablesChanged !== false && ! $allowTables) {
            throw new AddonLifecycleException($tablesChanged === null
                ? 'The declared tables cannot be compared, because the compiled manifest has no record of this addon. Check addon.json, then run again with --allow-tables.'
                : 'The declared tables changed. Changing tables is a data-safety event, so it needs --allow-tables. Run with --dry-run to see the change first.');
        }

        if ($manifest->version === $addon->version) {
            $changes[] = "addon.json changed, but the version is still {$addon->version}. Consider bumping the version.";
        }

        $downgrade = version_compare($manifest->version, $addon->version, '<');

        if ($downgrade && ! $force) {
            throw new AddonLifecycleException("addon.json says version {$manifest->version}, which is lower than the recorded {$addon->version}. Downgrades are refused. Use --force only if the database matches the older code, because migrations are not reversed.");
        }

        if ($downgrade) {
            $changes[] = "Forced downgrade from {$addon->version} to {$manifest->version}. Migrations are not reversed, so the database can hold tables or columns that the older code does not expect.";
        }

        return new AddonUpdate($addon, $manifest, $addon->version, $changes, unchanged: false, downgrade: $downgrade);
    }

    /**
     * What the new file changes, compared with the last compiled record. Without a record, only the new version is shown.
     *
     * @param  array<string, mixed>|null  $recorded
     * @return list<string>
     */
    private function changesFrom(?array $recorded, AddonManifest $manifest): array
    {
        if ($recorded === null) {
            return ["The compiled manifest has no record of this addon, so the changes cannot be listed. The new file declares version {$manifest->version}."];
        }

        $now = $manifest->toArray();
        $changes = [];

        foreach (['version', 'label', 'core', 'requires', 'provider', 'routes', 'routes_mount', 'permissions', 'migrations', 'tables', 'config', 'translations', 'pages'] as $key) {
            $was = $recorded[$key] ?? null;
            $new = $now[$key] ?? null;

            if ($was !== $new) {
                $changes[] = $key.': '.$this->showValue($was).' -> '.$this->showValue($new);
            }
        }

        return $changes;
    }

    /**
     * Whether the declared tables differ from the recorded ones. Null when there is no record to compare with.
     *
     * @param  array<string, mixed>|null  $recorded
     */
    private function tablesChanged(?array $recorded, AddonManifest $manifest): ?bool
    {
        if ($recorded === null) {
            return null;
        }

        $was = array_map(strval(...), (array) ($recorded['tables'] ?? []));
        $now = array_map(strval(...), $manifest->tables);
        sort($was);
        sort($now);

        return $was !== $now;
    }

    /**
     * @param  array<array-key, mixed>|string|null  $value
     */
    private function showValue(array|string|null $value): string
    {
        return $value === null ? 'none' : (string) json_encode($value, JSON_UNESCAPED_SLASHES);
    }

    /**
     * A route cache built before an install does not have the new addon's routes. Removing it makes the next boot
     * register the routes again. Run php artisan route:cache after the change to cache them.
     */
    private function forgetStaleRouteCache(): void
    {
        if (app()->routesAreCached()) {
            File::delete(app()->getCachedRoutesPath());
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
     * Adopting takes over tables that already exist. A missing one means the addon has never been run here.
     *
     * @throws AddonLifecycleException
     */
    private function assertTablesExist(AddonManifest $manifest): void
    {
        foreach ($manifest->tables as $table) {
            if (! Schema::hasTable($table)) {
                throw new AddonLifecycleException("Cannot adopt [{$manifest->slug}]: the table [{$table}] does not exist. Run activation without --adopt to create it.");
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
