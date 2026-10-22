<?php

use App\Addons\AddonCompiler;
use App\Addons\AddonLifecycle;
use App\Addons\AddonRegistry;
use App\Addons\AddonRouteLoader;
use App\Addons\Discovery\AddonDiscovery;
use App\Addons\Events\AddonManifestCompiling;
use App\Addons\Exceptions\AddonLifecycleException;
use App\Addons\Exceptions\AddonManifestException;
use App\Models\Addon;
use App\Models\AddonMigration;
use App\Models\AuditLog;
use App\Models\User;
use App\Providers\AddonServiceProvider;
use Fixtures\LifecycleFixture\LifecycleFixtureServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\Support\Addons\AddonSandbox;

const FIXTURE_SLUG = 'lifecycle-fixture';
const FIXTURE_MIGRATION = '2026_01_01_000000_create_lifecycle_fixture_items_table';
const FIXTURE_PERMISSION = 'lifecycle-fixture.view';

/**
 * The temporary addon root of the running test. Set in beforeEach, read by the tests.
 */
function addonRoot(?string $set = null): string
{
    static $root = '';

    return $set === null ? $root : ($root = $set);
}

beforeEach(function () {
    addonRoot(AddonSandbox::create());
});

afterEach(function () {
    Event::forget(AddonManifestCompiling::class);
    AddonSandbox::destroy(addonRoot());
});

/** The permission names a role holds, read fresh from the database. */
function rolePermissionNames(string $role): array
{
    return Role::query()->where('name', $role)->firstOrFail()->permissions()->pluck('name')->all();
}

test('discovery and install record the addon without enabling it', function () {
    $result = app(AddonDiscovery::class)->discover();

    expect(array_keys($result->manifests))->toBe([FIXTURE_SLUG])
        ->and($result->hasErrors())->toBeFalse();

    $addon = app(AddonLifecycle::class)->install(FIXTURE_SLUG);

    expect($addon->status)->toBe(Addon::STATUS_INSTALLED)
        ->and($addon->enabled)->toBeFalse()
        ->and(Addon::query()->where('slug', FIXTURE_SLUG)->exists())->toBeTrue()
        ->and(AuditLog::query()->where('action', 'addon.installed')->exists())->toBeTrue();

    $compiled = AddonSandbox::compiled(addonRoot());

    expect($compiled['addons'][FIXTURE_SLUG]['enabled'])->toBeFalse()
        ->and($compiled['addons'][FIXTURE_SLUG]['status'])->toBe(Addon::STATUS_INSTALLED);
});

test('activation runs migrations, syncs permissions, enables the addon and loads its provider', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(FIXTURE_SLUG);

    $addon = $lifecycle->activate(FIXTURE_SLUG);

    expect($addon->status)->toBe(Addon::STATUS_ACTIVE)
        ->and($addon->enabled)->toBeTrue()
        ->and(Schema::hasTable('lifecycle_fixture_items'))->toBeTrue()
        ->and(AddonMigration::query()->where('addon_slug', FIXTURE_SLUG)->pluck('migration')->all())->toBe([FIXTURE_MIGRATION])
        ->and(AuditLog::query()->where('action', 'addon.activated')->exists())->toBeTrue();

    $compiled = AddonSandbox::compiled(addonRoot());

    expect($compiled['addons'][FIXTURE_SLUG]['enabled'])->toBeTrue()
        ->and($compiled['state_checksum'])->not->toBeNull();

    // The compiled manifest is what the app reads at boot. Load it the same way and check the provider is wired.
    app(AddonRegistry::class)->reload();

    expect(app(AddonRegistry::class)->isActive(FIXTURE_SLUG))->toBeTrue()
        ->and(Permission::query()->where('name', FIXTURE_PERMISSION)->exists())->toBeTrue()
        ->and(rolePermissionNames('admin'))->toContain(FIXTURE_PERMISSION);
});

test('activation refuses an addon that is already active, and an addon that is not installed', function () {
    $lifecycle = app(AddonLifecycle::class);

    expect(fn () => $lifecycle->activate(FIXTURE_SLUG))
        ->toThrow(AddonLifecycleException::class, 'is not installed');

    $lifecycle->install(FIXTURE_SLUG);
    $lifecycle->activate(FIXTURE_SLUG);

    expect(fn () => $lifecycle->activate(FIXTURE_SLUG))
        ->toThrow(AddonLifecycleException::class, 'is already active');
});

test('deactivation keeps code, tables and data, removes permissions from roles and direct user grants, and runs no down-migration', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(FIXTURE_SLUG);
    $lifecycle->activate(FIXTURE_SLUG);

    Role::findOrCreate('editor')->givePermissionTo(FIXTURE_PERMISSION);
    $grantee = User::factory()->create();
    $grantee->givePermissionTo(FIXTURE_PERMISSION);
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    DB::table('lifecycle_fixture_items')->insert(['label' => 'kept', 'created_at' => now(), 'updated_at' => now()]);

    $addon = $lifecycle->deactivate(FIXTURE_SLUG);

    expect($addon->status)->toBe(Addon::STATUS_INACTIVE)
        ->and($addon->enabled)->toBeFalse()
        ->and(is_dir(addonRoot().'/addons/'.FIXTURE_SLUG))->toBeTrue()
        ->and(Schema::hasTable('lifecycle_fixture_items'))->toBeTrue()
        ->and(DB::table('lifecycle_fixture_items')->count())->toBe(1)
        ->and(AddonMigration::query()->where('addon_slug', FIXTURE_SLUG)->count())->toBe(1)
        ->and(rolePermissionNames('admin'))->not->toContain(FIXTURE_PERMISSION)
        ->and(rolePermissionNames('editor'))->not->toContain(FIXTURE_PERMISSION)
        ->and($grantee->refresh()->hasDirectPermission(FIXTURE_PERMISSION))->toBeFalse()
        ->and(Permission::query()->where('name', FIXTURE_PERMISSION)->exists())->toBeTrue()
        ->and(AddonSandbox::compiled(addonRoot())['addons'][FIXTURE_SLUG]['enabled'])->toBeFalse();
});

test('a deactivated addon can be activated again without running its migrations twice', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(FIXTURE_SLUG);
    $lifecycle->activate(FIXTURE_SLUG);
    $lifecycle->deactivate(FIXTURE_SLUG);

    $addon = $lifecycle->activate(FIXTURE_SLUG);

    expect($addon->status)->toBe(Addon::STATUS_ACTIVE)
        ->and(AddonMigration::query()->where('addon_slug', FIXTURE_SLUG)->count())->toBe(1);
});

test('deactivation is refused while an active addon depends on it', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(FIXTURE_SLUG);
    $lifecycle->activate(FIXTURE_SLUG);

    // Simulate a dependent by rewriting the compiled manifest; the lifecycle reads dependents from it.
    $compiled = AddonSandbox::compiled(addonRoot());
    $compiled['addons']['dependent'] = [...$compiled['addons'][FIXTURE_SLUG], 'slug' => 'dependent', 'enabled' => true, 'requires' => [FIXTURE_SLUG => '^1.0']];
    file_put_contents(addonRoot().'/cache/addons.php', "<?php\n\nreturn ".var_export($compiled, true).";\n");
    app(AddonRegistry::class)->reload();

    expect(fn () => $lifecycle->deactivate(FIXTURE_SLUG))
        ->toThrow(AddonLifecycleException::class, 'depend on it: dependent');
});

test('the addon.active middleware answers 404 when the addon is inactive, and its routes work when it is active', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(FIXTURE_SLUG);

    // The routes of an installed addon are always registered, so the route set does not change when it is switched.
    AddonRouteLoader::register(app('router'), app(AddonRegistry::class));

    $this->get('/addons/'.FIXTURE_SLUG.'/ping')->assertNotFound();

    $lifecycle->activate(FIXTURE_SLUG);

    $this->get('/addons/'.FIXTURE_SLUG.'/ping')
        ->assertOk()
        ->assertJson(['addon' => FIXTURE_SLUG, 'ok' => true]);

    $lifecycle->deactivate(FIXTURE_SLUG);

    $this->get('/addons/'.FIXTURE_SLUG.'/ping')->assertNotFound();
});

test('the addon service provider loads an addon provider only while the addon is active', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(FIXTURE_SLUG);

    // Running the provider's register() again is what boot does with the compiled manifest.
    (new AddonServiceProvider(app()))->register();
    expect(app()->bound(LifecycleFixtureServiceProvider::MARKER))->toBeFalse();

    $lifecycle->activate(FIXTURE_SLUG);

    (new AddonServiceProvider(app()))->register();
    expect(app()->bound(LifecycleFixtureServiceProvider::MARKER))->toBeTrue();
});

test('a migration failure rolls its work back, marks the addon failed and keeps it switched off', function () {
    config(['addons.lifecycle-fixture.fail_at' => 'migrate']);

    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(FIXTURE_SLUG);

    expect(fn () => $lifecycle->activate(FIXTURE_SLUG))
        ->toThrow(AddonLifecycleException::class, 'Simulated failure');

    $addon = Addon::query()->where('slug', FIXTURE_SLUG)->firstOrFail();

    expect($addon->status)->toBe(Addon::STATUS_FAILED)
        ->and($addon->enabled)->toBeFalse()
        ->and($addon->last_error)->toContain('Simulated failure')
        ->and(Schema::hasTable('lifecycle_fixture_items'))->toBeFalse()
        ->and(AddonMigration::query()->where('addon_slug', FIXTURE_SLUG)->count())->toBe(0)
        ->and(AuditLog::query()->where('action', 'addon.failed')->exists())->toBeTrue()
        ->and(AddonSandbox::compiled(addonRoot())['addons'][FIXTURE_SLUG]['enabled'])->toBeFalse();
});

test('a failed migration can be recovered by activating again once the cause is fixed', function () {
    config(['addons.lifecycle-fixture.fail_at' => 'migrate']);

    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(FIXTURE_SLUG);

    expect(fn () => $lifecycle->activate(FIXTURE_SLUG))->toThrow(AddonLifecycleException::class);

    config(['addons.lifecycle-fixture.fail_at' => null]);

    $addon = $lifecycle->activate(FIXTURE_SLUG);

    expect($addon->status)->toBe(Addon::STATUS_ACTIVE)
        ->and($addon->last_error)->toBeNull()
        ->and(Schema::hasTable('lifecycle_fixture_items'))->toBeTrue()
        ->and(AddonMigration::query()->where('addon_slug', FIXTURE_SLUG)->count())->toBe(1);
});

test('a compile failure during activation restores the last-good manifest and marks the addon failed', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(FIXTURE_SLUG);
    $before = file_get_contents(addonRoot().'/cache/addons.php');

    Event::listen(AddonManifestCompiling::class, function (): void {
        throw new RuntimeException('Simulated compile failure.');
    });

    expect(fn () => $lifecycle->activate(FIXTURE_SLUG))
        ->toThrow(AddonLifecycleException::class, 'Simulated compile failure');

    $addon = Addon::query()->where('slug', FIXTURE_SLUG)->firstOrFail();

    expect($addon->status)->toBe(Addon::STATUS_FAILED)
        ->and($addon->enabled)->toBeFalse()
        ->and(file_get_contents(addonRoot().'/cache/addons.php'))->toBe($before)
        ->and(AddonSandbox::compiled(addonRoot())['addons'][FIXTURE_SLUG]['enabled'])->toBeFalse();

    // Retrying after the fault is gone finishes the activation. The migration already ran, so it is not run again.
    Event::forget(AddonManifestCompiling::class);

    expect($lifecycle->activate(FIXTURE_SLUG)->status)->toBe(Addon::STATUS_ACTIVE)
        ->and(AddonMigration::query()->where('addon_slug', FIXTURE_SLUG)->count())->toBe(1);
});

test('a compile failure during install leaves no addon row behind', function () {
    Event::listen(AddonManifestCompiling::class, function (): void {
        throw new RuntimeException('Simulated compile failure.');
    });

    expect(fn () => app(AddonLifecycle::class)->install(FIXTURE_SLUG))
        ->toThrow(AddonLifecycleException::class, 'Simulated compile failure');

    expect(Addon::query()->where('slug', FIXTURE_SLUG)->exists())->toBeFalse()
        ->and(file_exists(addonRoot().'/cache/addons.php'))->toBeFalse();
});

test('a changed addon.json blocks compile and is reported as out of date', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(FIXTURE_SLUG);

    file_put_contents(AddonSandbox::addonPath(addonRoot()).'/addon.json', json_encode(['changed' => true]));

    expect(fn () => app(AddonCompiler::class)->compile())
        ->toThrow(AddonManifestException::class, 'changed on disk after the addon was installed');

    expect(implode("\n", app(AddonCompiler::class)->problems()))->toContain('changed on disk');
});

test('a missing or unreadable compiled manifest enables no addons and logs a warning', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(FIXTURE_SLUG);
    $lifecycle->activate(FIXTURE_SLUG);

    Log::spy();
    unlink(addonRoot().'/cache/addons.php');

    $registry = new AddonRegistry;

    expect($registry->status())->toBe(AddonRegistry::STATUS_MISSING)
        ->and($registry->active())->toBe([])
        ->and($registry->isActive(FIXTURE_SLUG))->toBeFalse();

    Log::shouldHaveReceived('warning')->once();

    file_put_contents(addonRoot().'/cache/addons.php', '<?php this is not valid php');

    $unreadable = new AddonRegistry;

    expect($unreadable->status())->toBe(AddonRegistry::STATUS_UNREADABLE)
        ->and($unreadable->active())->toBe([]);
});

test('restoring a snapshot brings back the last good state after a failed operation', function () {
    $lifecycle = app(AddonLifecycle::class);
    $lifecycle->install(FIXTURE_SLUG);
    $lifecycle->activate(FIXTURE_SLUG);

    expect(fn () => $lifecycle->deactivate('no-such-addon'))->toThrow(AddonLifecycleException::class, 'is not installed');

    expect(AddonSandbox::compiled(addonRoot())['addons'][FIXTURE_SLUG]['enabled'])->toBeTrue();
});
