<?php

declare(strict_types=1);

use App\Cms\Boot\ProviderLoader;
use App\Cms\Repositories\ThemeRepository;
use App\Cms\Sections\SectionRegistry;
use App\Cms\Themes\ThemeManager;
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

    $this->manager = app(ThemeManager::class);
    $this->repository = app(ThemeRepository::class);

    // Themes are registered by `lattice:install`; tests do the same step.
    foreach ($this->repository->discovered() as $manifest) {
        $this->repository->install($manifest);
    }
});

it('discovers both bundled themes from disk', function () {
    $themes = collect($this->manager->all());

    expect($themes)->toHaveCount(2)
        ->and($themes->pluck('handle')->all())->toContain('aperture', 'meridian')
        ->and($themes->firstWhere('handle', 'aperture')['tokens']['accent'])->toBe('oklch(0.51 0.19 264)')
        ->and($themes->firstWhere('handle', 'meridian')['tokens']['radius'])->toBe('0.125rem');
});

it('activates a theme and keeps exactly one active', function () {
    $this->artisan('cache:clear');

    $this->manager->activate('aperture');
    expect($this->repository->active()?->handle)->toBe('aperture');

    $this->manager->activate('meridian');

    expect($this->repository->active()?->handle)->toBe('meridian')
        ->and($this->repository->installed())->toHaveCount(2)
        ->and(collect($this->repository->installed())->where('is_active', true))->toHaveCount(1);
});

it('exposes the active theme tokens and components', function () {
    $this->manager->activate('meridian');

    expect($this->manager->tokens()['accent'])->toBe('oklch(0.55 0.12 190)')
        ->and($this->manager->component('page'))->toBe('themes/meridian/page')
        ->and($this->manager->component('not_found'))->toBe('themes/meridian/not-found')
        ->and($this->manager->activeTheme()['degraded'])->toBeFalse();
});

it('falls back to the core renderer when nothing is active', function () {
    expect($this->manager->active())->toBeNull()
        ->and($this->manager->component('page'))->toBe('public/page')
        ->and($this->manager->component('not_found'))->toBe('public/not-found')
        ->and($this->manager->tokens()['radius'])->toBe('0.625rem');
});

it('refuses to activate a theme that is not on disk', function () {
    expect(fn () => $this->manager->activate('does-not-exist'))
        ->toThrow(RuntimeException::class);
});

it('registers theme sections on top of the core set', function () {
    // A theme's provider is registered at boot, so the section arrives after
    // the theme becomes active and the loader re-runs.
    $this->manager->activate('aperture');
    app(ProviderLoader::class)->reload();

    $registry = app(SectionRegistry::class);

    $keys = array_keys($registry->all());

    expect($keys)->toContain('hero', 'rich-text', 'feature-grid', 'cta', 'stat-band')
        ->and($registry->find('stat-band')?->label)->toBe('Stat band');
});

it('renders the appearance screen with themes and permission flags', function () {
    $this->manager->activate('aperture');

    $this->actingAs($this->editor)
        ->get('/admin/appearance')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/appearance/index')
            ->has('themes', 2)
            ->where('active.handle', 'aperture')
            ->where('can.activate', true));

    $this->actingAs($this->author)->get('/admin/appearance')->assertForbidden();
});

it('activates a theme over http and records it', function () {
    $this->actingAs($this->editor)
        ->post('/admin/appearance/aperture/activate')
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($this->repository->active()?->handle)->toBe('aperture');

    $this->actingAs($this->editor)
        ->post('/admin/appearance/meridian/activate')
        ->assertRedirect();

    expect($this->repository->active()?->handle)->toBe('meridian');
});

it('refuses activation from users without the permission and unknown handles', function () {
    $this->actingAs($this->author)
        ->post('/admin/appearance/aperture/activate')
        ->assertForbidden();

    expect($this->repository->active())->toBeNull();

    $this->actingAs($this->editor)
        ->post('/admin/appearance/nope/activate')
        ->assertSessionHasErrors('theme');
});
