<?php

use App\Models\User;
use App\Support\DisplaySettings;

test('display settings page is displayed with defaults', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('display.edit'));

    $response->assertOk();
});

test('display items can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('display.update'), [
            'items' => ['repository', 'documentation'],
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('display.edit'));

    expect($user->fresh()->display_items)->toBe(['repository', 'documentation']);
});

test('at least one display item is required', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('display.update'), [
            'items' => [],
        ]);

    $response->assertSessionHasErrors('items');
});

test('unknown display items are rejected', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('display.update'), [
            'items' => ['not-a-real-item'],
        ]);

    $response->assertSessionHasErrors('items.0');
    expect(DisplaySettings::ITEMS)->not->toContain('not-a-real-item');
});

test('all display items are shown when the user has not chosen', function () {
    $user = User::factory()->create(['display_items' => null]);

    expect(DisplaySettings::forUser($user))->toBe(DisplaySettings::ITEMS);
});

test('saved display items that no longer exist fall back to all items', function () {
    $user = User::factory()->create(['display_items' => ['recents', 'home']]);

    expect(DisplaySettings::forUser($user))->toBe(DisplaySettings::ITEMS);
});

test('sidebar only receives the display items the user chose', function () {
    $user = User::factory()->create(['display_items' => ['documentation']]);

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertInertia(fn ($page) => $page->where('displayItems', ['documentation']));
});

