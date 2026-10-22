<?php

namespace Fixtures\LifecycleFixture;

use Illuminate\Support\ServiceProvider;

/**
 * Test-only addon provider. Binds a marker so tests can see that the provider was loaded from the compiled manifest.
 */
final class LifecycleFixtureServiceProvider extends ServiceProvider
{
    public const MARKER = 'lifecycle-fixture.loaded';

    public function register(): void
    {
        $this->app->instance(self::MARKER, true);
    }
}
