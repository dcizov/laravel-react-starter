<?php

use App\Cms\Addons\AddonManager;
use App\Cms\Manifests\AddonManifest;
use App\Models\User;

beforeEach(function () {
    app(AddonManager::class)->install(AddonManifest::fromPath(config('lattice.paths.addons').'/Demo'));
});

it('serves the addon screen and lists it in the shared navigation once active', function () {
    app(AddonManager::class)->activate('Demo');
    $this->refreshApplication();

    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/admin/demo');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('demo')
            ->has('notes')
            ->where('navigation', fn ($sections) => collect($sections)
                ->flatMap(fn ($section) => $section['items'])
                ->pluck('label')
                ->contains('Demo')));
});

it('hides the addon screen and its navigation entry once deactivated', function () {
    app(AddonManager::class)->activate('Demo');
    app(AddonManager::class)->deactivate('Demo');
    $this->refreshApplication();

    $user = User::factory()->create();

    $this->actingAs($user)->get('/admin/demo')->assertNotFound();

    $this->actingAs($user)->get('/admin')->assertOk()
        ->assertInertia(fn ($page) => $page->where('navigation', fn ($sections) => collect($sections)
            ->flatMap(fn ($section) => $section['items'])
            ->pluck('label')
            ->doesntContain('Demo')));
});

it('lists core navigation from the registry, not from react', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/admin')->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('navigation', fn ($sections) => collect($sections)->pluck('label')->all() === [
                'Content', 'Site', 'System', 'Team', 'Workspace',
            ]));
});
