<?php

use App\Features\Integrations\Models\IntegrationConnection;
use App\Models\User;
use App\Support\Rbac;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    Rbac::sync();
});

function integrationsAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    return $admin;
}

test('the catalogue needs the integrations permission', function () {
    $user = User::factory()->create();
    $user->assignRole(Rbac::DEFAULT_ROLE);

    $this->actingAs($user)
        ->get(route('admin.integrations.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->put(route('admin.integrations.update', 'stripe'), ['publishable_key' => 'pk', 'secret_key' => 'sk'])
        ->assertForbidden();
});

test('saving a connection encrypts the credentials at rest', function () {
    $this->actingAs(integrationsAdmin())
        ->put(route('admin.integrations.update', 'stripe'), [
            'publishable_key' => 'pk_live_123',
            'secret_key' => 'sk_live_very_secret',
        ])
        ->assertRedirect();

    $raw = DB::table('integration_connections')->where('integration_key', 'stripe')->value('credentials');

    expect($raw)->not->toContain('sk_live_very_secret')
        ->and($raw)->not->toContain('pk_live_123');

    $connection = IntegrationConnection::query()->where('integration_key', 'stripe')->firstOrFail();

    expect($connection->credentials)->toEqual([
        'publishable_key' => 'pk_live_123',
        'secret_key' => 'sk_live_very_secret',
    ]);
});

test('secrets are never sent to the browser, only a mask and a configured flag', function () {
    $admin = integrationsAdmin();

    $this->actingAs($admin)
        ->put(route('admin.integrations.update', 'stripe'), [
            'publishable_key' => 'pk_live_123',
            'secret_key' => 'sk_live_very_secret',
        ]);

    $this->actingAs($admin)
        ->get(route('admin.integrations.index'))
        ->assertOk()
        ->assertDontSee('sk_live_very_secret')
        ->assertInertia(fn ($page) => $page
            ->component('admin/integrations/index')
            ->where('integrations.0.key', 'stripe')
            ->where('integrations.0.connected', true)
            ->where('integrations.0.fields.0.value', 'pk_live_123')
            ->where('integrations.0.fields.1.key', 'secret_key')
            ->where('integrations.0.fields.1.value', null)
            ->where('integrations.0.fields.1.configured', true));
});

test('a blank secret on a later save keeps the saved value', function () {
    $admin = integrationsAdmin();

    $this->actingAs($admin)
        ->put(route('admin.integrations.update', 'stripe'), [
            'publishable_key' => 'pk_live_123',
            'secret_key' => 'sk_live_very_secret',
        ]);

    $this->actingAs($admin)
        ->put(route('admin.integrations.update', 'stripe'), [
            'publishable_key' => 'pk_live_456',
            'secret_key' => '',
        ])
        ->assertRedirect();

    $connection = IntegrationConnection::query()->where('integration_key', 'stripe')->firstOrFail();

    expect($connection->credentials)->toEqual([
        'publishable_key' => 'pk_live_456',
        'secret_key' => 'sk_live_very_secret',
    ]);
});

test('a new connection needs every field', function () {
    $this->actingAs(integrationsAdmin())
        ->put(route('admin.integrations.update', 'stripe'), ['publishable_key' => 'pk_live_123'])
        ->assertSessionHasErrors('secret_key');

    expect(IntegrationConnection::query()->count())->toBe(0);
});

test('disconnecting removes the saved credentials', function () {
    $admin = integrationsAdmin();

    $this->actingAs($admin)
        ->put(route('admin.integrations.update', 'postmark'), ['server_token' => 'token-123']);

    $this->actingAs($admin)
        ->delete(route('admin.integrations.destroy', 'postmark'))
        ->assertRedirect();

    expect(IntegrationConnection::query()->where('integration_key', 'postmark')->exists())->toBeFalse();
});

test('an unknown integration returns not found', function () {
    $this->actingAs(integrationsAdmin())
        ->put(route('admin.integrations.update', 'not-a-tool'), ['x' => 'y'])
        ->assertNotFound();
});
