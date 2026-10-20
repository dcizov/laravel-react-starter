<?php

use App\Models\User;
use App\Support\SidebarVariant;

test('appearance page shows the saved sidebar style', function () {
    $user = User::factory()->create(['sidebar_variant' => 'floating']);

    $this->actingAs($user)
        ->get(route('appearance.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/appearance')
            ->where('sidebarVariant', 'floating'));
});

test('sidebar style defaults to inset', function () {
    $user = User::factory()->create();

    expect(SidebarVariant::forUser($user))->toBe('inset');
});

test('sidebar style can be changed and is shared with every page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('appearance.update'), ['sidebar_variant' => 'floating'])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('appearance.edit'));

    expect($user->refresh()->sidebar_variant)->toBe('floating');

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('sidebarVariant', 'floating'));
});

test('sidebar style must be a known variant', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('appearance.update'), ['sidebar_variant' => 'sticky'])
        ->assertSessionHasErrors('sidebar_variant');

    expect($user->refresh()->sidebar_variant)->toBe('inset');
});
