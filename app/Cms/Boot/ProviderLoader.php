<?php

declare(strict_types=1);

namespace App\Cms\Boot;

use App\Cms\Manifests\AddonManifest;
use App\Cms\Registries\Navigation;
use App\Cms\Repositories\AddonRepository;
use App\Cms\Repositories\ThemeRepository;
use App\Cms\Support\SafeMode;
use Illuminate\Contracts\Foundation\Application;
use Throwable;

/**
 * Registers the service providers of every active addon and of the active
 * theme. This is the only place where the database decides what boots.
 *
 * Runs inside `CoreServiceProvider::register()`, which is earlier than
 * Eloquent's connection resolver — hence the query-builder repositories and
 * the defensive guards around cache, schema and router.
 */
final class ProviderLoader
{
    public function __construct(
        private readonly Application $app,
        private readonly SafeMode $safeMode,
        private readonly AddonRepository $addons,
        private readonly ThemeRepository $themes,
        private readonly Navigation $navigation,
    ) {}

    public function register(): void
    {
        if (! $this->installed()) {
            return;
        }

        foreach ($this->addons->activeManifests() as $manifest) {
            $this->registerAddon($manifest);
        }

        $theme = $this->themes->activeManifest();

        if ($theme !== null) {
            $this->safeMode->register(
                'theme',
                $theme->handle,
                $theme->provider,
                fn () => $this->app->register($theme->provider),
            );
        }

        $this->refreshRouteLookups();
    }

    /**
     * Re-register everything in the current process. Used by lifecycle
     * commands and by tests that simulate the next request.
     */
    public function reload(): void
    {
        $this->navigation->flush();
        $this->addons->flushCache();
        $this->themes->flushCache();

        $this->register();
    }

    /**
     * Have the core CMS tables been migrated yet? On a fresh clone they have
     * not, and the application must still boot (installer screen).
     */
    public function installed(): bool
    {
        if (! $this->app->bound('db')) {
            return false;
        }

        try {
            return $this->app['db']->connection()->getSchemaBuilder()->hasTable('addons');
        } catch (Throwable) {
            return false;
        }
    }

    private function registerAddon(AddonManifest $manifest): void
    {
        // Addons publish their own navigation entries; the provider is the
        // only code that runs before the route refresh below.
        $this->safeMode->register(
            'addon',
            $manifest->handle,
            $manifest->provider,
            function () use ($manifest): void {
                $this->app->register($manifest->provider);

                $this->navigation->addMany($this->navigationItems($manifest));
            },
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function navigationItems(AddonManifest $manifest): array
    {
        return array_map(
            fn (array $item): array => $item + ['addon' => $manifest->handle],
            $manifest->navigation,
        );
    }

    /**
     * `loadRoutesFrom()` runs immediately, but the router's name and action
     * lookup tables are built at boot. Registering a provider afterwards
     * leaves them stale, so `route()` and `Route::has()` would miss the
     * addon's routes.
     */
    private function refreshRouteLookups(): void
    {
        if (! $this->app->bound('router')) {
            return;
        }

        $routes = $this->app->make('router')->getRoutes();
        $routes->refreshNameLookups();
        $routes->refreshActionLookups();
    }
}
