<?php

use App\Models\User;

test('account settings page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('account.edit'))
        ->assertOk();
});

test('account date of birth and language can be updated', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->patch(route('account.update'), [
            'date_of_birth' => '1990-05-17',
            'locale' => 'vi',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('account.edit'));

    $user->refresh();

    expect($user->date_of_birth->format('Y-m-d'))->toBe('1990-05-17');
    expect($user->locale)->toBe('vi');
});

test('date of birth can be cleared', function () {
    $user = User::factory()->create(['date_of_birth' => '1990-05-17']);

    $this->actingAs($user)
        ->patch(route('account.update'), [
            'date_of_birth' => null,
            'locale' => 'en',
        ])
        ->assertSessionHasNoErrors();

    expect($user->fresh()->date_of_birth)->toBeNull();
});

test('date of birth must be in the past', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('account.update'), [
            'date_of_birth' => now()->addDay()->format('Y-m-d'),
            'locale' => 'en',
        ])
        ->assertSessionHasErrors('date_of_birth');
});

test('language must be a supported option', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('account.update'), [
            'date_of_birth' => null,
            'locale' => 'fr',
        ])
        ->assertSessionHasErrors('locale');
});
