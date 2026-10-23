<?php

use App\Addons\AddonRegistry;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Tests\Support\Addons\AddonSandbox;

/**
 * The temporary root of the running test. Set in beforeEach, read by the tests.
 */
function withoutAddonsRoot(?string $set = null): string
{
    static $root = '';

    return $set === null ? $root : ($root = $set);
}

/**
 * The state of a checkout without addons/: an empty addon folder, and no compiled manifest. The sandbox points the app
 * at the temporary root, so the repository's addons/ folder is never read or changed.
 */
beforeEach(function () {
    $root = AddonSandbox::create();

    File::deleteDirectory(AddonSandbox::addonPath($root));

    withoutAddonsRoot($root);
    app(AddonRegistry::class)->reload();
});

afterEach(function () {
    AddonSandbox::destroy(withoutAddonsRoot());
});

test('the dashboard renders with no addons folder and no compiled manifest, and shows no addon', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('dashboard'))
        ->assertOk()
        ->assertDontSee('Newsletter');
});

test('a dashboard request reads no addon table: the registry reads the compiled file only', function () {
    $user = User::factory()->create();

    $statements = [];
    DB::listen(function ($query) use (&$statements): void {
        $statements[] = $query->sql;
    });

    $this->actingAs($user)->get(route('dashboard'))->assertOk();

    expect(collect($statements)->filter(fn (string $sql): bool => preg_match('/\baddons\b/i', $sql) === 1)->values()->all())
        ->toBe([]);
});

test('the registry reports the manifest missing, enables nothing, and warns once', function () {
    Log::spy();

    $registry = new AddonRegistry;

    expect($registry->status())->toBe(AddonRegistry::STATUS_MISSING)
        ->and($registry->active())->toBe([])
        ->and($registry->isActive('newsletter'))->toBeFalse();

    Log::shouldHaveReceived('warning')->once();
});

test('core routes register, and the addon routes do not', function () {
    $routes = app('router')->getRoutes();

    expect($routes->getByName('dashboard'))->not->toBeNull()
        ->and($routes->getByName('newsletter.create'))->toBeNull()
        ->and($routes->getByName('admin.newsletter.index'))->toBeNull();
});
