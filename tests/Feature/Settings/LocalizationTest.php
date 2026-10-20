<?php

use App\Models\User;
use App\Support\Locales;
use App\Support\Timezones;
use Inertia\Testing\AssertableInertia as Assert;

test('a german user gets german translations and their timezone', function () {
    $user = User::factory()->create(['locale' => 'de', 'timezone' => 'Europe/Vienna']);

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('locale', 'de')
            ->where('timezone', 'Europe/Vienna')
            ->where('translations.Save', 'Speichern'),
        );
});

test('english is the default language and timezone', function () {
    $user = User::factory()->create(['locale' => null, 'timezone' => null]);

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('locale', 'en')
            ->where('timezone', 'UTC'),
        );
});

test('a german user without a chosen timezone defaults to berlin', function () {
    $user = User::factory()->create(['locale' => 'de', 'timezone' => null]);

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page->where('timezone', 'Europe/Berlin'));
});

test('an unsupported stored language falls back to english', function () {
    $user = User::factory()->create(['locale' => 'vi']);

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page->where('locale', Locales::DEFAULT));
});

test('the language list and timezone list are the ones the app supports', function () {
    expect(Locales::codes())->toBe(['en', 'de'])
        ->and(Timezones::ZONES)->toContain('Europe/Berlin', 'UTC');
});

test('relative dates follow the user language', function () {
    $user = User::factory()->create(['locale' => 'de']);

    $this->actingAs($user)->get(route('profile.edit'));

    expect(now()->subDay()->diffForHumans())->toContain('vor');
});
