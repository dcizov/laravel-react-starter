<?php

use App\Models\User;
use App\Support\SidebarVariant;

test('appearance page shows the saved sidebar style', function () {
    $user = User::factory()->create(['sidebar_variant' => 'floating', 'font' => 'instrument-sans']);

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
        ->patch(route('appearance.update'), ['sidebar_variant' => 'floating', 'font' => 'instrument-sans'])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('appearance.edit'));

    expect($user->refresh()->sidebar_variant)->toBe('floating');

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('sidebarVariant', 'floating'));
});

test('font can be saved and is shared with every page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('appearance.update'), ['sidebar_variant' => 'inset', 'font' => 'manrope'])
        ->assertSessionHasNoErrors();

    expect($user->refresh()->font)->toBe('manrope');

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('font', 'manrope'));
});

test('font must be a known option', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('appearance.update'), ['sidebar_variant' => 'inset', 'font' => 'comic-sans'])
        ->assertSessionHasErrors('font');
});

test('sidebar style must be a known variant', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('appearance.update'), ['sidebar_variant' => 'sticky', 'font' => 'instrument-sans'])
        ->assertSessionHasErrors('sidebar_variant');

    expect($user->refresh()->sidebar_variant)->toBe('inset');
});
