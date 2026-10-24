<?php

declare(strict_types=1);

use App\Cms\Addons\AddonCatalog;
use App\Cms\Repositories\AddonRepository;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->assignRole('Admin');

    $this->editor = User::factory()->create();
    $this->editor->assignRole('Editor');

    $this->author = User::factory()->create();
    $this->author->assignRole('Author');

    // `lattice:install` does this in a real install.
    foreach (app(AddonRepository::class)->discovered() as $manifest) {
        if ($manifest->handle === 'Shopper') {
            continue;
        }

        app(AddonRepository::class)->install($manifest);
    }
});

it('lists installed and discovered addons with the incompatible one blocked', function () {
    $this->actingAs($this->admin)
        ->get('/admin/addons')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/addons/index')
            ->where('can.manage', true)
            ->has('addons', 3)
            ->where('addons.0.handle', 'Demo')
            ->where('addons.1.handle', 'PostCraft')
            ->where('addons.2.handle', 'Shopper')
            ->where('addons.2.status', 'blocked')
            ->where('addons.2.installed', false)
            ->where('counts.blocked', 1));
});

it('shows the exact reason an incompatible addon cannot be installed', function () {
    $cards = collect(app(AddonCatalog::class)->cards());
    $shopper = $cards->firstWhere('handle', 'Shopper');

    expect($shopper['error'])->toContain('lattice')
        ->and($shopper['error'])->toContain('^2.0');
});

it('refuses to install an incompatible addon over http with a readable error', function () {
    $this->actingAs($this->admin)
        ->post('/admin/addons/Shopper/install')
        ->assertRedirect()
        ->assertSessionHasErrors('addon');

    expect(app(AddonRepository::class)->find('Shopper'))->toBeNull();
});

it('activates and deactivates over http, keeping the row', function () {
    $this->actingAs($this->admin)
        ->post('/admin/addons/Demo/activate')
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(app(AddonRepository::class)->find('Demo')->status)->toBe('active')
        ->and(app(AddonRepository::class)->find('Demo')->activated_at)->not->toBeNull();

    $this->actingAs($this->admin)
        ->post('/admin/addons/Demo/deactivate')
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(app(AddonRepository::class)->find('Demo')->status)->toBe('inactive');
});

it('gives editors a read-only screen and hides it from authors', function () {
    $this->actingAs($this->editor)
        ->get('/admin/addons')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('can.manage', false));

    $this->actingAs($this->editor)
        ->post('/admin/addons/Demo/activate')
        ->assertForbidden();

    $this->actingAs($this->author)->get('/admin/addons')->assertForbidden();
    $this->actingAs($this->author)->post('/admin/addons/Demo/activate')->assertForbidden();
});

it('requires the handle to be typed before uninstalling', function () {
    $this->actingAs($this->admin)
        ->delete('/admin/addons/Demo', ['confirm' => 'Wrong'])
        ->assertSessionHasErrors('confirm');

    expect(app(AddonRepository::class)->find('Demo'))->not->toBeNull();
});

it('uninstalls without touching the addon folder when files are kept', function () {
    $this->actingAs($this->admin)
        ->delete('/admin/addons/Demo', ['confirm' => 'Demo', 'delete_data' => false, 'delete_files' => false])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(app(AddonRepository::class)->find('Demo'))->toBeNull()
        ->and(is_dir(app_path('Addons/Demo')))->toBeTrue();
});

it('rejects an unknown addon handle', function () {
    $this->actingAs($this->admin)
        ->post('/admin/addons/Nope/activate')
        ->assertSessionHasErrors('addon');

    $this->actingAs($this->admin)
        ->post('/admin/addons/Nope/install')
        ->assertSessionHasErrors('addon');
});
