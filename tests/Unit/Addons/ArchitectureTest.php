<?php

// Boundaries for the addon infrastructure. Each rule names what must not be imported, so a refactor that
// crosses one fails here rather than in production.

arch('addon infrastructure does not depend on App\Features')
    ->expect('App\Addons')
    ->not->toUse('App\Features');

// Core never names an optional addon. An addon adds itself through a registry such as DashboardCards, from its own
// provider. Without this rule the coupling could return unnoticed.
arch('no core code outside the addon folders refers to the newsletter addon namespace')
    ->expect('App')
    ->not->toUse('Addons\Newsletter');

arch('addon infrastructure does not depend on the HTTP or console layers')
    ->expect('App\Addons')
    ->not->toUse(['App\Http', 'App\Console']);

arch('the addon manifest and discovery code does not depend on the database or RBAC')
    ->expect('App\Addons\Manifest')
    ->not->toUse(['App\Models', 'App\Support\Rbac', 'Illuminate\Support\Facades\DB']);

arch('the lifecycle fixture is self-contained and imports no core or other addon code')
    ->expect('Fixtures\LifecycleFixture')
    ->not->toUse(['App\Addons', 'App\Features', 'App\Models', 'App\Support', 'App\Http', 'App\Providers', 'App\Console']);
