<?php

namespace App\Providers;

use App\Features\FeatureRegistry;
use Illuminate\Support\ServiceProvider;

/**
 * Loads the providers of the features that are switched on. Runs before the others, so a feature's
 * routes and migrations are in place by the time the application boots.
 */
class FeatureServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(FeatureRegistry::class);

        foreach ($this->app->make(FeatureRegistry::class)->providers() as $provider) {
            $this->app->register($provider);
        }
    }
}
