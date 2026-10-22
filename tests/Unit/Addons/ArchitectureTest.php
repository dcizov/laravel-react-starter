<?php

// Boundaries for the addon infrastructure. Each rule names what must not be imported, so a refactor that
// crosses one fails here rather than in production.

arch('addon infrastructure does not depend on App\Features')
    ->expect('App\Addons')
    ->not->toUse('App\Features');

arch('addon infrastructure does not depend on the HTTP or console layers')
    ->expect('App\Addons')
    ->not->toUse(['App\Http', 'App\Console']);

arch('the addon manifest and discovery code does not depend on the database or RBAC')
    ->expect('App\Addons\Manifest')
    ->not->toUse(['App\Models', 'App\Support\Rbac', 'Illuminate\Support\Facades\DB']);

arch('the lifecycle fixture is self-contained and imports no core or other addon code')
    ->expect('Fixtures\LifecycleFixture')
    ->not->toUse(['App\Addons', 'App\Features', 'App\Models', 'App\Support', 'App\Http', 'App\Providers', 'App\Console']);
