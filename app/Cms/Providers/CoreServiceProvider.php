<?php

namespace App\Cms\Providers;

use App\Cms\Boot\ProviderLoader;
use App\Cms\Permissions\AbilityMap;
use App\Cms\Registries\Navigation;
use App\Cms\Repositories\AddonRepository;
use App\Cms\Repositories\ThemeRepository;
use App\Cms\Sections\SectionRegistry;
use App\Cms\Settings\SettingRepository;
use App\Cms\Support\SafeMode;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;

/**
 * The core of Lattice.
 *
 * Registered first in `bootstrap/providers.php` because it decides which
 * extension providers boot. It must never import a concrete addon or theme
 * class — everything is resolved from manifests.
 */
class CoreServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(config_path('lattice.php'), 'lattice');

        $this->app->singleton(Navigation::class, fn (): Navigation => new Navigation);
        $this->app->singleton(AddonRepository::class, fn (Application $app): AddonRepository => new AddonRepository($app));
        $this->app->singleton(ThemeRepository::class, fn (Application $app): ThemeRepository => new ThemeRepository($app));
        // Shared, because themes and addons register their sections into it at
        // boot and every request (editor, validator, renderer) must see them.
        $this->app->singleton(SectionRegistry::class, fn (Application $app): SectionRegistry => new SectionRegistry(
            $app->make(AddonRepository::class),
            $app->make(ThemeRepository::class),
        ));
        // Shared per request: the ability map is built once and handed to both
        // the Inertia props and the controllers that ask about abilities.
        $this->app->scoped(AbilityMap::class, fn (): AbilityMap => new AbilityMap);

        // Scoped: the repository memoises the settings table for one request.
        $this->app->scoped(SettingRepository::class, fn (Application $app): SettingRepository => new SettingRepository($app));
        $this->app->singleton(SafeMode::class, fn (Application $app): SafeMode => new SafeMode(
            $app,
            $app->make(AddonRepository::class),
            $app->make(ThemeRepository::class),
        ));
        $this->app->singleton(ProviderLoader::class, fn (Application $app): ProviderLoader => new ProviderLoader(
            $app,
            $app->make(SafeMode::class),
            $app->make(AddonRepository::class),
            $app->make(ThemeRepository::class),
            $app->make(Navigation::class),
        ));

        $this->bootExtensions();
    }

    public function boot(): void
    {
        $this->registerCoreNavigation();

        // Public chrome reads `config('lattice.site.*')`; the saved identity
        // overrides those keys once instead of being threaded through every
        // controller.
        $this->app->make(SettingRepository::class)->applyToConfig();
    }

    /**
     * Hand boot to the provider loader. Anything a provider needs that is not
     * yet available (cache, Eloquent, router lookups) is guarded inside.
     */
    private function bootExtensions(): void
    {
        if (! $this->app->bound('config')) {
            return;
        }

        $this->app->make(ProviderLoader::class)->register();
    }

    /**
     * Core navigation is registered here, not in the addon loader, so it is
     * present even when no addon is installed.
     */
    private function registerCoreNavigation(): void
    {
        $this->app->make(Navigation::class)->addMany(config('lattice.core_navigation', []));
    }
}
