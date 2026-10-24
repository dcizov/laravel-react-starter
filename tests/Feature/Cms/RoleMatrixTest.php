<?php

declare(strict_types=1);

use App\Cms\Addons\AddonManager;
use App\Cms\Manifests\AddonManifest;
use App\Cms\Permissions\AbilityMap;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Spatie\Permission\Models\Role;

it('seeds the three roles with the configured abilities', function () {
    $this->seed(RolePermissionSeeder::class);

    expect(Role::pluck('name')->sort()->values()->all())->toBe(['Admin', 'Author', 'Editor']);

    $editor = User::factory()->create();
    $editor->assignRole('Editor');

    expect($editor->can('pages.publish'))->toBeTrue()
        ->and($editor->can('addons.manage'))->toBeFalse()
        ->and($editor->can('users.manage'))->toBeFalse();

    $author = User::factory()->create();
    $author->assignRole('Author');

    expect($author->can('pages.update'))->toBeTrue()
        ->and($author->can('pages.publish'))->toBeFalse()
        ->and($author->can('pages.delete'))->toBeFalse();

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    expect($admin->can('users.manage'))->toBeTrue()
        ->and($admin->can('addons.manage'))->toBeTrue();
});

it('hides the ability map from inactive users', function () {
    $this->seed(RolePermissionSeeder::class);

    $user = User::factory()->create(['is_active' => false]);
    $user->assignRole('Admin');

    expect(app(AbilityMap::class)->for($user))->toBe([]);
});

it('reports the last administrator so they cannot be locked out', function () {
    $this->seed(RolePermissionSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $second = User::factory()->create();
    $second->assignRole('Admin');

    expect($admin->isLastAdmin())->toBeFalse();

    $second->forceFill(['is_active' => false])->save();
    $second->refresh();

    expect($admin->refresh()->isLastAdmin())->toBeTrue();
});

it('keeps permissions in sync when an addon is activated', function () {
    $this->seed(RolePermissionSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $manifest = AddonManifest::fromPath(config('lattice.paths.addons').'/Demo');
    app(AddonManager::class)->install($manifest);
    app(AddonManager::class)->activate('Demo');

    expect($admin->refresh()->can('demo:view'))->toBeTrue();
});
