<?php

use Addons\Newsletter\Models\NewsletterSubscriber;
use App\Addons\AddonLifecycle;
use App\Models\User;
use App\Support\Rbac;
use Illuminate\Support\Facades\DB;

// The newsletter card reaches the dashboard only through the card registry, from the addon's own provider. These
// tests cover the three states of the addon: absent, switched off, and switched on.

beforeEach(function () {
    $this->withoutVite();
    Rbac::sync();
});

/**
 * Every SQL statement the dashboard runs while the deferred overview loads, so a test can prove that no
 * newsletter query was issued.
 *
 * @return list<string>
 */
function sqlWhile(Closure $run): array
{
    $statements = [];

    DB::listen(function ($query) use (&$statements) {
        $statements[] = $query->sql;
    });

    $run();

    return $statements;
}

test('the dashboard renders without the newsletter addon installed, and sends no newsletter card', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->get(route('dashboard'))->assertOk();

    $statements = sqlWhile(fn () => $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->loadDeferredProps(fn ($reload) => $reload
            ->has('overview.site')
            ->missing('overview.newsletter'))));

    expect(array_filter($statements, fn (string $sql): bool => str_contains($sql, 'newsletter_subscribers')))->toBe([]);
});

test('an addon that has been switched off contributes no card and runs no newsletter query', function () {
    activateNewsletterAddon();
    NewsletterSubscriber::query()->create([
        'email' => 'one@example.com',
        'status' => NewsletterSubscriber::SUBSCRIBED,
        'token' => 'token-one',
        'subscribed_at' => now(),
    ]);

    app(AddonLifecycle::class)->deactivate('newsletter');

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $statements = sqlWhile(fn () => $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->loadDeferredProps(fn ($reload) => $reload
            ->has('overview.site')
            ->missing('overview.newsletter'))));

    expect(array_filter($statements, fn (string $sql): bool => str_contains($sql, 'newsletter_subscribers')))->toBe([]);
});

test('an active addon contributes its card with the subscribed count, for users with its permission', function () {
    activateNewsletterAddon();

    foreach (['a@example.com', 'b@example.com'] as $email) {
        NewsletterSubscriber::query()->create([
            'email' => $email,
            'status' => NewsletterSubscriber::SUBSCRIBED,
            'token' => 'token-'.$email,
            'subscribed_at' => now(),
        ]);
    }

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->loadDeferredProps(fn ($reload) => $reload
                ->has('overview.newsletter')
                ->where('overview.newsletter.subscribed', 2)));
});

test('a user without the newsletter permission gets no newsletter card', function () {
    activateNewsletterAddon();

    $reader = User::factory()->create();
    $reader->givePermissionTo(['comments.moderate']);

    $this->actingAs($reader)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->loadDeferredProps(fn ($reload) => $reload
                ->missing('overview.newsletter')));
});
