<?php

use App\Features\FeatureManager;
use App\Features\FeatureRegistry;
use App\Features\Landing\LandingFeature;
use App\Features\Newsletter\NewsletterFeature;
use App\Models\User;
use App\Support\Rbac;
use Spatie\Permission\Models\Role;
use Tests\Support\Features\FakeBaseFeature;
use Tests\Support\Features\FakeDependentFeature;

test('the registry lists every feature the code provides, by slug', function () {
    $available = app(FeatureRegistry::class)->available();

    expect(array_keys($available))->toEqual(['landing', 'newsletter', 'integrations', 'cms', 'blog', 'seo'])
        ->and($available['landing'])->toBe(LandingFeature::class)
        ->and($available['newsletter'])->toBe(NewsletterFeature::class);
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
        ->and($admin->hasPermissionTo('newsletter.manage'))->toBeFalse()
        ->and(\Spatie\Permission\Models\Permission::query()->where('name', 'newsletter.manage')->exists())->toBeTrue();
});
