<?php

use App\Features\FeatureManager;
use App\Features\FeatureRegistry;
use App\Features\Landing\LandingFeature;
use App\Models\User;
use App\Support\Rbac;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Support\Addons\AddonSandbox;
use Tests\Support\Features\FakeBaseFeature;
use Tests\Support\Features\FakeDependentFeature;

test('the registry lists every feature the code provides, by slug', function () {
    $available = app(FeatureRegistry::class)->available();

    expect(array_keys($available))->toEqual(['landing', 'integrations', 'cms', 'blog', 'seo'])
        ->and($available['landing'])->toBe(LandingFeature::class);
});

test('an unknown feature name in FEATURES is rejected with the known names', function () {
    config(['features.enabled' => ['landing', 'nope']]);

    expect(fn () => app(FeatureRegistry::class)->enabled())
        ->toThrow(InvalidArgumentException::class, 'Unknown feature(s): nope');
});

test('a feature whose dependency is not enabled is rejected', function () {
    config([
        'features.available' => [FakeBaseFeature::class, FakeDependentFeature::class],
        'features.enabled' => ['fake-dependent'],
    ]);

    expect(fn () => app(FeatureRegistry::class)->enabled())
        ->toThrow(InvalidArgumentException::class, 'Feature [fake-dependent] needs fake-base enabled too.');
});

test('a feature with its dependency enabled is accepted', function () {
    config([
        'features.available' => [FakeBaseFeature::class, FakeDependentFeature::class],
        'features.enabled' => ['fake-base', 'fake-dependent'],
    ]);

    expect(app(FeatureRegistry::class)->enabled())->toEqual(['fake-base', 'fake-dependent']);
});

test('disabling a feature that another enabled feature depends on is refused', function () {
    config([
        'features.available' => [FakeBaseFeature::class, FakeDependentFeature::class],
        'features.enabled' => ['fake-base', 'fake-dependent'],
    ]);

    // Refused before anything is written, so .env is not touched by this test.
    expect(fn () => app(FeatureManager::class)->disable('fake-base'))
        ->toThrow(InvalidArgumentException::class, 'Cannot disable [fake-base] while fake-dependent depends on it.');
});

test('enabling an unknown feature is refused before anything is written', function () {
    config(['features.enabled' => ['landing']]);

    expect(fn () => app(FeatureManager::class)->enable('nope', migrate: false))
        ->toThrow(InvalidArgumentException::class, 'Unknown feature [nope].');
});

test('the roles screen only offers the permissions of enabled features', function () {
    // No addon is active here, so the list depends only on the features. The sandbox is removed when the test ends.
    $root = AddonSandbox::create();
    register_shutdown_function(fn () => AddonSandbox::destroy($root));

    Rbac::sync();

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    config(['features.enabled' => ['landing']]);

    $response = $this->actingAs($admin)
        ->get(route('admin.roles.create'))
        ->assertOk();

    $props = $response->viewData('page')['props'];

    expect($props['permissions'])->toContain('landing.manage')
        ->and($props['permissions'])->not->toContain('newsletter.manage')
        ->and($props['permissions'])->not->toContain('integrations.manage');
});

test('syncing with a feature disabled removes its permission from admin, and keeps the permission row', function () {
    Rbac::sync();

    config(['features.enabled' => ['landing']]);
    Rbac::syncFeaturePermissions();

    $admin = Role::findByName('admin');

    expect($admin->hasPermissionTo('landing.manage'))->toBeTrue()
        ->and($admin->hasPermissionTo('integrations.manage'))->toBeFalse()
        ->and(Permission::query()->where('name', 'integrations.manage')->exists())->toBeTrue();
});

test('the roles screen offers an active addon permission, and still leaves out disabled features', function () {
    activateNewsletterAddon();

    Rbac::sync();

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    config(['features.enabled' => ['landing']]);

    $props = $this->actingAs($admin)
        ->get(route('admin.roles.create'))
        ->assertOk()
        ->viewData('page')['props'];

    expect($props['permissions'])->toContain('landing.manage', 'newsletter.manage')
        ->and($props['permissions'])->not->toContain('integrations.manage');
});
