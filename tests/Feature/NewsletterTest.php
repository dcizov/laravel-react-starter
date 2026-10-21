<?php

use App\Features\Newsletter\Models\NewsletterSubscriber;
use App\Models\User;
use App\Support\Rbac;

beforeEach(function () {
    Rbac::sync();
});

test('a visitor can subscribe and is shown the same message as a repeat sign-up', function () {
    $this->post(route('newsletter.store'), ['email' => 'Ada@Example.com'])
        ->assertRedirect();

    $subscriber = NewsletterSubscriber::query()->where('email', 'ada@example.com')->firstOrFail();

    expect($subscriber->status)->toBe(NewsletterSubscriber::SUBSCRIBED)
        ->and($subscriber->token)->not->toBeEmpty()
        ->and($subscriber->subscribed_at)->not->toBeNull();

    $this->post(route('newsletter.store'), ['email' => 'ada@example.com'])
        ->assertRedirect();

    expect(NewsletterSubscriber::query()->count())->toBe(1);
});

test('an invalid email is rejected', function () {
    $this->post(route('newsletter.store'), ['email' => 'not-an-email'])
        ->assertSessionHasErrors('email');

    expect(NewsletterSubscriber::query()->count())->toBe(0);
});

test('an unsubscribe link marks the subscriber as unsubscribed and keeps the row', function () {
    $this->post(route('newsletter.store'), ['email' => 'grace@example.com']);

    $subscriber = NewsletterSubscriber::query()->where('email', 'grace@example.com')->firstOrFail();

    $this->get(route('newsletter.unsubscribe', $subscriber->token))
        ->assertOk();

    $subscriber->refresh();

    expect($subscriber->status)->toBe(NewsletterSubscriber::UNSUBSCRIBED)
        ->and($subscriber->unsubscribed_at)->not->toBeNull()
        ->and(NewsletterSubscriber::query()->count())->toBe(1);
});

test('an unknown unsubscribe token returns not found', function () {
    $this->get(route('newsletter.unsubscribe', 'does-not-exist'))
        ->assertNotFound();
});

test('signing up again after unsubscribing subscribes the same row again', function () {
    $this->post(route('newsletter.store'), ['email' => 'linus@example.com']);
    $subscriber = NewsletterSubscriber::query()->where('email', 'linus@example.com')->firstOrFail();
    $this->get(route('newsletter.unsubscribe', $subscriber->token));

    $this->post(route('newsletter.store'), ['email' => 'linus@example.com']);

    $subscriber->refresh();

    expect($subscriber->status)->toBe(NewsletterSubscriber::SUBSCRIBED)
        ->and($subscriber->unsubscribed_at)->toBeNull()
        ->and(NewsletterSubscriber::query()->count())->toBe(1);
});

test('the admin list needs the newsletter permission', function () {
    $user = User::factory()->create();
    $user->assignRole(Rbac::DEFAULT_ROLE);

    $this->actingAs($user)
        ->get(route('admin.newsletter.index'))
        ->assertForbidden();
});

test('the admin list can be searched and a subscriber can be deleted', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    NewsletterSubscriber::query()->create(['email' => 'one@example.com', 'status' => 'subscribed', 'token' => 'token-one']);
    $other = NewsletterSubscriber::query()->create(['email' => 'two@example.com', 'status' => 'subscribed', 'token' => 'token-two']);

    $this->actingAs($admin)
        ->get(route('admin.newsletter.index', ['search' => 'two@']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/newsletter')
            ->has('subscribers.data', 1)
            ->where('subscribers.data.0.email', 'two@example.com'));

    $this->actingAs($admin)
        ->delete(route('admin.newsletter.destroy', $other))
        ->assertRedirect();

    expect(NewsletterSubscriber::query()->where('email', 'two@example.com')->exists())->toBeFalse();
});

test('the CSV export lists the subscribers', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    NewsletterSubscriber::query()->create(['email' => 'csv@example.com', 'status' => 'subscribed', 'token' => 'token-csv']);

    $response = $this->actingAs($admin)
        ->get(route('admin.newsletter.csv'))
        ->assertOk()
        ->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

    expect($response->streamedContent())->toContain('email,status,subscribed_at,unsubscribed_at')
        ->and($response->streamedContent())->toContain('csv@example.com');
});

test('the token is never included in the subscriber data sent to the browser', function () {
    $subscriber = NewsletterSubscriber::query()->create(['email' => 'hidden@example.com', 'status' => 'subscribed', 'token' => 'secret-token']);

    expect($subscriber->toArray())->not->toHaveKey('token');
});
