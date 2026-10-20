<?php

use App\Models\User;
use App\Support\Locales;

test('language can be changed from the top bar', function () {
    $user = User::factory()->create(['locale' => 'en']);

    $this->actingAs($user)
        ->patch(route('language.update'), ['locale' => 'de'])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($user->refresh()->locale)->toBe('de');
});

test('language change does not touch other account settings', function () {
    $user = User::factory()->create(['locale' => 'en', 'timezone' => 'Europe/Berlin']);

    $this->actingAs($user)->patch(route('language.update'), ['locale' => 'de']);

    expect($user->refresh()->timezone)->toBe('Europe/Berlin');
});

test('unsupported languages are rejected', function () {
    $user = User::factory()->create(['locale' => 'en']);

    $this->actingAs($user)
        ->patch(route('language.update'), ['locale' => 'vi'])
        ->assertSessionHasErrors('locale');

    expect($user->refresh()->locale)->toBe('en');
});

test('shared props list the supported languages', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('locales', Locales::options()));
});
