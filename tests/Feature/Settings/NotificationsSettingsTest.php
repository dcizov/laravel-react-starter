<?php

use App\Models\User;

test('notifications settings page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('notifications.edit'));

    $response->assertOk();
});

test('notification settings can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('notifications.update'), [
            'type' => 'mentions',
            'mobile' => true,
            'communication_emails' => false,
            'social_emails' => true,
            'marketing_emails' => false,
            'security_emails' => true,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('notifications.edit'));

    expect($user->fresh()->notification_settings)->toMatchArray([
        'type' => 'mentions',
        'mobile' => true,
        'social_emails' => true,
        'security_emails' => true,
    ]);
});

test('notification type must be a known option', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('notifications.update'), [
            'type' => 'everything',
            'security_emails' => true,
        ]);

    $response->assertSessionHasErrors('type');
});
