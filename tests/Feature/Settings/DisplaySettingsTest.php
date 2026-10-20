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
            'items' => ['home', 'documents'],
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('display.edit'));

    expect($user->fresh()->display_items)->toBe(['home', 'documents']);
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
