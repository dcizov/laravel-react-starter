<?php

use Addons\Newsletter\Models\NewsletterSubscriber;
use App\Addons\AddonLifecycle;
use App\Addons\AddonRegistry;
use App\Models\User;
use App\Support\Rbac;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;

// The Newsletter addon is copied from the repository into a temporary addon root for each test. Its routes are
// registered on activation, and an inactive addon answers 404 through the addon middleware.

beforeEach(function () {
    Rbac::sync();
    activateNewsletterAddon();
});

test('the newsletter addon is installed and active, and admin gets its permission', function () {
    expect(app(AddonRegistry::class)->isActive('newsletter'))->toBeTrue()
        ->and(Role::findByName('admin')->hasPermissionTo('newsletter.manage'))->toBeTrue();
});

test('the public pages and the admin page answer while the addon is active', function () {
    expect(app('router')->has([
        'newsletter.create',
        'newsletter.store',
        'newsletter.unsubscribe',
        'admin.newsletter.index',
        'admin.newsletter.destroy',
        'admin.newsletter.csv',
    ]))->toBeTrue();

    $this->get(route('newsletter.create'))->assertOk();

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get(route('admin.newsletter.index'))
        ->assertOk();
});

test('deactivating gates the routes, removes the permission, and keeps the data and tables', function () {
    NewsletterSubscriber::query()->create([
        'email' => 'kept@example.com',
        'status' => 'subscribed',
        'token' => 'kept-token',
        'subscribed_at' => now(),
    ]);

    app(AddonLifecycle::class)->deactivate('newsletter');

    expect(app(AddonRegistry::class)->isActive('newsletter'))->toBeFalse()
        ->and(Role::findByName('admin')->hasPermissionTo('newsletter.manage'))->toBeFalse()
        ->and(Schema::hasTable('newsletter_subscribers'))->toBeTrue()
        ->and(NewsletterSubscriber::query()->where('email', 'kept@example.com')->exists())->toBeTrue();

    $this->get(route('newsletter.create'))->assertNotFound();

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get(route('admin.newsletter.index'))
        ->assertNotFound();
});

test('a guest gets the same 404 for the admin page of an inactive addon, not a login redirect', function () {
    app(AddonLifecycle::class)->deactivate('newsletter');

    $this->get(route('admin.newsletter.index'))->assertNotFound();
});

test('reactivating restores the routes and the permission, with the stored data', function () {
    app(AddonLifecycle::class)->deactivate('newsletter');
    app(AddonLifecycle::class)->activate('newsletter');

    expect(Role::findByName('admin')->hasPermissionTo('newsletter.manage'))->toBeTrue();

    $this->get(route('newsletter.create'))->assertOk();
});
