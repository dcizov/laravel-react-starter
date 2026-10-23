<?php

use App\Addons\AddonPageRoutes;
use App\Addons\AddonRegistry;
use Tests\Support\Addons\AddonSandbox;

/**
 * The temporary addon root of the running test. Set in beforeEach, read by the tests.
 */
function pageRouteRoot(?string $set = null): string
{
    static $root = '';

    return $set === null ? $root : ($root = $set);
}

/**
 * The folder the newsletter controllers are autoloaded from. The sandbox copies the addon, but the classes stay in the
 * repository, so the check compares against the repository folder.
 */
function pageRouteAddonDirectory(): string
{
    return base_path('addons/newsletter');
}

beforeEach(function () {
    pageRouteRoot(AddonSandbox::activateRepositoryAddon('newsletter'));
});

afterEach(function () {
    AddonSandbox::destroy(pageRouteRoot());
});

test('every url the newsletter addon declares reaches a route of the newsletter addon', function () {
    $pages = app(AddonRegistry::class)->entry('newsletter')['pages'];

    expect(collect($pages)->pluck('url')->filter()->values()->all())->not->toBeEmpty()
        ->and(AddonPageRoutes::unresolved(app('router'), $pages, pageRouteAddonDirectory()))->toBe([]);
});

test('a declared url with no route is reported', function () {
    $pages = [['page' => 'subscribe', 'layout' => 'public', 'url' => '/no-such-page']];

    expect(AddonPageRoutes::unresolved(app('router'), $pages, pageRouteAddonDirectory()))->toBe(['/no-such-page']);
});

test('a declared url that core answers is not counted as the addon\'s', function () {
    $pages = [['page' => 'subscribe', 'layout' => 'public', 'url' => '/dashboard']];

    expect(AddonPageRoutes::unresolved(app('router'), $pages, pageRouteAddonDirectory()))->toBe(['/dashboard']);
});

test('a page without a url is not checked', function () {
    $pages = [['page' => 'unsubscribed', 'layout' => 'public']];

    expect(AddonPageRoutes::unresolved(app('router'), $pages, pageRouteAddonDirectory()))->toBe([]);
});
