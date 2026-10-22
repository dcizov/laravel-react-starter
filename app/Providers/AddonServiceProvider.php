<?php

namespace App\Providers;

use App\Addons\AddonCompiler;
use App\Addons\AddonLifecycle;
use App\Addons\AddonMigrator;
use App\Addons\AddonRegistry;
use App\Addons\AddonRouteLoader;
use App\Addons\Discovery\AddonDiscovery;
use App\Addons\Manifest\ManifestValidator;
use App\Features\FeatureRegistry;
use App\Support\Rbac;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;

/**
 * Loads the addons the compiled manifest says are enabled: their config, their service provider and their
 * translations. Their routes are registered for every installed addon, and the middleware keeps inactive ones
 * unreachable.
 *
 * Runs after the feature providers. Addons never change the feature system.
 */
final class AddonServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AddonRegistry::class);

        $this->app->bind(ManifestValidator::class, fn (): ManifestValidator => $this->validator());

        $this->app->bind(AddonDiscovery::class, fn (Application $app): AddonDiscovery => new AddonDiscovery(
            $app->make(ManifestValidator::class),
            array_values((array) config('addons.paths', [])),
        ));

        $this->app->bind(AddonCompiler::class);
        $this->app->bind(AddonMigrator::class);
        $this->app->bind(AddonLifecycle::class);

        $registry = $this->app->make(AddonRegistry::class);

        foreach ($registry->active() as $slug => $entry) {
            $config = $entry['config'] ?? null;

            if (is_string($config) && is_file($config)) {
                $this->mergeConfigFrom($config, 'addons.'.$slug);
            }

            $provider = $entry['provider'] ?? null;

            if (is_string($provider) && class_exists($provider)) {
                $this->app->register($provider);
            }
        }
    }

    public function boot(): void
    {
        $registry = $this->app->make(AddonRegistry::class);

        foreach ($registry->active() as $slug => $entry) {
            $translations = $entry['translations'] ?? null;

            if (is_string($translations) && is_dir($translations)) {
                $this->loadTranslationsFrom($translations, (string) $slug);
            }
        }

        $router = $this->app->make('router');

        // With cached routes, the routes come from the cache, which was built with the same installed set.
        if ($this->app->routesAreCached()) {
            AddonRouteLoader::acknowledge($router, $registry);
        } else {
            AddonRouteLoader::load($router, $this->routeEntries($registry));
        }
    }

    /**
     * The addons whose routes are registered at boot: the installed ones. In the console, the addons in the addon
     * folders too, so php artisan wayfinder:generate writes the helpers for an addon whether it is installed or not.
     * The addon.active middleware still answers 404 to a request for an addon that is not active.
     *
     * @return array<string, array<string, mixed>>
     */
    private function routeEntries(AddonRegistry $registry): array
    {
        $entries = $registry->installed();

        if (! $this->app->runningInConsole()) {
            return $entries;
        }

        foreach ($this->app->make(AddonDiscovery::class)->discover()->manifests as $slug => $manifest) {
            $entries[(string) $slug] ??= $manifest->toArray();
        }

        return $entries;
    }

    /**
     * The rules a manifest is checked against. Feature slugs and permissions are reserved, so an addon cannot take
     * a name that a feature already uses.
     */
    private function validator(): ManifestValidator
    {
        $features = $this->app->make(FeatureRegistry::class);
        $reservedSlugs = [...(array) config('addons.reserved_slugs', [])];
        $reservedPermissions = [...Rbac::CORE_PERMISSIONS];

        foreach ($features->available() as $slug => $class) {
            $reservedSlugs[] = $slug;

            array_push($reservedPermissions, ...$class::permissions());
        }

        return new ManifestValidator(
            array_values(array_unique(array_map('strval', $reservedSlugs))),
            array_values(array_unique($reservedPermissions)),
            (string) config('addons.core_version'),
        );
    }
}
