<?php

namespace App\Cms\Addons;

use App\Cms\Boot\ProviderLoader;
use App\Cms\Manifests\AddonManifest;
use App\Cms\Manifests\ManifestValidator;
use App\Cms\Repositories\AddonRepository;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Database\Migrations\DatabaseMigrationRepository;
use Illuminate\Database\Migrations\Migrator;
use Illuminate\Support\ServiceProvider;
use RuntimeException;
use Throwable;

/**
 * The addon lifecycle: install → activate → deactivate → uninstall.
 *
 * Invariants:
 *  - constraints are checked before anything changes;
 *  - a failed activation rolls back the migrations it just ran;
 *  - deactivation keeps data, uninstall only drops that addon's own tables;
 *  - the installed manifest (database) wins over the folder on disk.
 */
final class AddonManager
{
    public function __construct(
        private readonly Application $app,
        private readonly AddonRepository $addons,
        private readonly ProviderLoader $loader,
    ) {}

    public function install(AddonManifest $manifest): void
    {
        $errors = ManifestValidator::validateAddon($manifest->toArray());

        if ($errors !== []) {
            throw new RuntimeException(implode(' ', $errors));
        }

        $requirements = $this->addons->satisfiesRequirements($manifest);

        if (! $requirements['ok']) {
            throw new RuntimeException((string) $requirements['reason']);
        }

        $this->addons->install($manifest);
        $this->act($manifest, 'install');
    }

    public function activate(string $handle): void
    {
        $manifest = $this->manifest($handle);
        $row = $this->addons->find($handle);

        if ($row === null) {
            throw new RuntimeException("Addon [{$handle}] is not installed.");
        }

        if ($row->status === 'active') {
            return;
        }

        // Installed manifest wins: the row, not the folder, decides requirements.
        $requirements = $this->addons->satisfiesRequirements($manifest);

        if (! $requirements['ok']) {
            throw new RuntimeException((string) $requirements['reason']);
        }

        $ranMigrations = false;

        try {
            $this->assertProviderIsHealthy($manifest);

            if ($manifest->migrations) {
                $ranMigrations = $this->migrate($handle);
            }

            $this->act($manifest, 'activate');

            $this->addons->setStatus($handle, 'active');
        } catch (Throwable $e) {
            if ($ranMigrations) {
                $this->rollbackMigrations($manifest);
            }

            $this->addons->markError($handle, $e->getMessage());

            throw $e;
        }

        $this->loader->reload();
    }

    public function deactivate(string $handle): void
    {
        $manifest = $this->manifest($handle);

        $this->act($manifest, 'deactivate');

        // Data stays behind on purpose: reactivating restores everything.
        $this->addons->setStatus($handle, 'inactive');

        $this->loader->reload();
    }

    /**
     * Remove an addon. Its own migrations are rolled back only when the caller
     * asks to delete the data; core tables are never touched. The folder is
     * removed only when the caller owns it (never for folders shipped with
     * the repository unless asked).
     */
    public function uninstall(string $handle, bool $deleteData = true, bool $deleteFiles = true): void
    {
        $manifest = $this->manifest($handle);

        if ($deleteData) {
            $this->rollbackMigrations($manifest);
        }

        $this->act($manifest, 'uninstall');

        $this->addons->delete($handle);

        if ($deleteFiles) {
            $this->deleteFiles($manifest);
        }

        $this->loader->reload();
    }

    /**
     * Run the addon's pending migrations. Returns true when something ran.
     */
    public function migrate(string $handle): bool
    {
        $manifest = $this->manifest($handle);
        $path = $manifest->migrationPath();

        if (! is_dir($path)) {
            return false;
        }

        $migrator = $this->migrator();
        $files = $migrator->getMigrationFiles([$path]);

        if ($files === []) {
            return false;
        }

        $ran = $migrator->getRepository()->getRan();
        $pending = array_diff(array_keys($files), $ran);

        if ($pending === []) {
            return false;
        }

        $migrator->run([$path], ['pretend' => false]);

        $this->attributeMigrations($handle, array_keys($files));

        return true;
    }

    /**
     * Roll back every migration that lives in the addon's folder.
     */
    public function rollbackMigrations(AddonManifest $manifest): void
    {
        $path = $manifest->migrationPath();

        if (! is_dir($path)) {
            return;
        }

        $migrator = $this->migrator();

        if (! $migrator->repositoryExists()) {
            return;
        }

        // Second argument is a bool in Laravel 13, never an array.
        $migrator->reset([$path], false);

        $this->app['db']->connection()->table('addon_migrations')
            ->where('addon_handle', $manifest->handle)
            ->delete();
    }

    public function manifest(string $handle): AddonManifest
    {
        $row = $this->addons->find($handle);

        if ($row === null) {
            throw new RuntimeException("Addon [{$handle}] is not installed.");
        }

        return $this->addons->manifestFromRow($row);
    }

    /**
     * Providers are checked before they are trusted: a folder that points at a
     * class that does not exist must not be marked active.
     */
    private function assertProviderIsHealthy(AddonManifest $manifest): void
    {
        if (! class_exists($manifest->provider)) {
            throw new RuntimeException("Provider class [{$manifest->provider}] does not exist.");
        }

        if (! is_subclass_of($manifest->provider, ServiceProvider::class)) {
            throw new RuntimeException("Provider [{$manifest->provider}] is not a service provider.");
        }
    }

    /**
     * Call the optional lifecycle hook on the addon's Activator class.
     */
    private function act(AddonManifest $manifest, string $action): void
    {
        $activator = $this->activatorClass($manifest);

        if ($activator === null || ! method_exists($activator, $action)) {
            return;
        }

        $this->app->make($activator)->{$action}();
    }

    private function activatorClass(AddonManifest $manifest): ?string
    {
        $class = preg_replace('/\\\\[^\\\\]+$/', '\\\\Activator', $manifest->provider);

        if (! is_string($class) || ! class_exists($class)) {
            return null;
        }

        return $class;
    }

    /**
     * Attribute freshly run migrations to the addon that owns them.
     *
     * @param  list<string>  $migrations
     */
    private function attributeMigrations(string $handle, array $migrations): void
    {
        $this->app['db']->connection()->table('addon_migrations')
            ->whereNull('addon_handle')
            ->whereIn('migration', $migrations)
            ->update(['addon_handle' => $handle, 'ran_at' => now()]);
    }

    private function migrator(): Migrator
    {
        // The repository expects the *connection resolver*, not a connection.
        $resolver = $this->app['db'];
        $repository = new DatabaseMigrationRepository($resolver, 'addon_migrations');

        if (! $repository->repositoryExists()) {
            $repository->createRepository();
        }

        return new Migrator($repository, $resolver, $this->app['files'], $this->app['events']);
    }

    private function deleteFiles(AddonManifest $manifest): void
    {
        $base = realpath((string) config('lattice.paths.addons'));
        $path = realpath($manifest->path);

        if ($base === false || $path === false || ! str_starts_with($path, $base.DIRECTORY_SEPARATOR)) {
            throw new RuntimeException('Refusing to delete files outside the addons folder.');
        }

        $this->app['files']->deleteDirectory($path);
    }
}
