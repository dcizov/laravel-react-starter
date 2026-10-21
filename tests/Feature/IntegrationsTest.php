<?php

use App\Features\Integrations\Models\IntegrationConnection;
use App\Models\User;
use App\Support\Rbac;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Rbac::sync();
    config(['services.google.client_id' => 'client-id.apps.googleusercontent.com']);
    config(['services.google.client_secret' => 'google-secret']);
});

function integrationsAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    return $admin;
}

test('the catalogue lists GitHub, Gmail and Google Calendar only', function () {
    $this->actingAs(integrationsAdmin())
        ->get(route('admin.integrations.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/integrations/index')
            ->has('integrations', 3)
            ->where('integrations.0.key', 'github')
            ->where('integrations.1.key', 'gmail')
            ->where('integrations.2.key', 'google-calendar'));
});

test('the catalogue needs the integrations permission', function () {
    $user = User::factory()->create();
    $user->assignRole(Rbac::DEFAULT_ROLE);

    $this->actingAs($user)
        ->get(route('admin.integrations.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->put(route('admin.integrations.update', 'github'), ['access_token' => 'ghp_1'])
        ->assertForbidden();
});

test('saving a token encrypts it at rest', function () {
    $this->actingAs(integrationsAdmin())
        ->put(route('admin.integrations.update', 'github'), ['access_token' => 'ghp_very_secret_token'])
        ->assertRedirect();

    $raw = DB::table('integration_connections')->where('integration_key', 'github')->value('credentials');

    expect($raw)->not->toContain('ghp_very_secret_token');

    $connection = IntegrationConnection::query()->where('integration_key', 'github')->firstOrFail();

    expect($connection->credentials)->toEqual(['access_token' => 'ghp_very_secret_token']);
});

test('a saved secret is never sent to the browser, only a configured flag', function () {
    $admin = integrationsAdmin();

    $this->actingAs($admin)
        ->put(route('admin.integrations.update', 'github'), ['access_token' => 'ghp_very_secret_token']);

    $this->actingAs($admin)
        ->get(route('admin.integrations.index'))
        ->assertOk()
        ->assertDontSee('ghp_very_secret_token')
        ->assertInertia(fn ($page) => $page
            ->where('integrations.0.connected', true)
            ->where('integrations.0.fields.0.key', 'access_token')
            ->where('integrations.0.fields.0.value', null)
            ->where('integrations.0.fields.0.configured', true));
});

test('a blank secret on a later save keeps the saved value', function () {
    $admin = integrationsAdmin();

    $this->actingAs($admin)
        ->put(route('admin.integrations.update', 'github'), ['access_token' => 'ghp_first']);

    $this->actingAs($admin)
        ->put(route('admin.integrations.update', 'github'), ['access_token' => ''])
        ->assertRedirect();

    $connection = IntegrationConnection::query()->where('integration_key', 'github')->firstOrFail();

    expect($connection->credentials)->toEqual(['access_token' => 'ghp_first']);
});

test('a new token connection needs its value', function () {
    $this->actingAs(integrationsAdmin())
        ->put(route('admin.integrations.update', 'github'), ['access_token' => ''])
        ->assertSessionHasErrors('access_token');

    expect(IntegrationConnection::query()->count())->toBe(0);
});

test('disconnecting removes the saved token', function () {
    $admin = integrationsAdmin();

    $this->actingAs($admin)
        ->put(route('admin.integrations.update', 'github'), ['access_token' => 'ghp_123']);

    $this->actingAs($admin)
        ->delete(route('admin.integrations.destroy', 'github'))
        ->assertRedirect();

    expect(IntegrationConnection::query()->where('integration_key', 'github')->exists())->toBeFalse();
});

test('sign-in tools cannot be saved through the token form', function () {
    $this->actingAs(integrationsAdmin())
        ->put(route('admin.integrations.update', 'gmail'), ['refresh_token' => 'x'])
        ->assertNotFound();
});

test('an unknown integration returns not found', function () {
    $this->actingAs(integrationsAdmin())
        ->put(route('admin.integrations.update', 'stripe'), ['secret_key' => 'x'])
        ->assertNotFound();
});

test('connecting Gmail sends the admin to Google with the Gmail scopes', function () {
    $response = $this->actingAs(integrationsAdmin())
        ->get(route('admin.integrations.oauth.redirect', 'gmail'));

    $location = $response->headers->get('Location');
    parse_str((string) parse_url($location, PHP_URL_QUERY), $query);

    expect($location)->toStartWith('https://accounts.google.com/o/oauth2/v2/auth')
        ->and($query['client_id'])->toBe('client-id.apps.googleusercontent.com')
        ->and($query['access_type'])->toBe('offline')
        ->and($query['scope'])->toContain('gmail.readonly')
        ->and($query['scope'])->toContain('gmail.send')
        ->and($query['state'])->not->toBeEmpty();
});

test('connecting does nothing useful when Google is not configured', function () {
    config(['services.google.client_id' => null]);

    $this->actingAs(integrationsAdmin())
        ->get(route('admin.integrations.oauth.redirect', 'google-calendar'))
        ->assertRedirect(route('admin.integrations.index'));
});

test('a callback with the wrong state saves nothing', function () {
    Http::fake();

    $this->actingAs(integrationsAdmin())
        ->withSession(['integrations.oauth' => ['integration' => 'gmail', 'state' => 'expected']])
        ->get(route('admin.integrations.oauth.callback', ['state' => 'forged', 'code' => 'abc']))
        ->assertRedirect(route('admin.integrations.index'));

    Http::assertNothingSent();
    expect(IntegrationConnection::query()->count())->toBe(0);
});

test('a successful Google callback stores the refresh token encrypted', function () {
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response(['refresh_token' => 'refresh-123', 'access_token' => 'a']),
    ]);

    $this->actingAs(integrationsAdmin())
        ->withSession(['integrations.oauth' => ['integration' => 'google-calendar', 'state' => 'good']])
        ->get(route('admin.integrations.oauth.callback', ['state' => 'good', 'code' => 'auth-code']))
        ->assertRedirect(route('admin.integrations.index'));

    $connection = IntegrationConnection::query()->where('integration_key', 'google-calendar')->firstOrFail();
    $raw = DB::table('integration_connections')->where('integration_key', 'google-calendar')->value('credentials');

    expect($connection->credentials)->toEqual(['refresh_token' => 'refresh-123'])
        ->and($raw)->not->toContain('refresh-123');
});

test('disconnecting Google revokes the token at Google', function () {
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response(['refresh_token' => 'refresh-123']),
        'oauth2.googleapis.com/revoke' => Http::response([], 200),
    ]);

    $admin = integrationsAdmin();

    $this->actingAs($admin)
        ->withSession(['integrations.oauth' => ['integration' => 'gmail', 'state' => 'good']])
        ->get(route('admin.integrations.oauth.callback', ['state' => 'good', 'code' => 'auth-code']));

    $this->actingAs($admin)
        ->delete(route('admin.integrations.destroy', 'gmail'))
        ->assertRedirect();

    Http::assertSent(fn ($request) => $request->url() === 'https://oauth2.googleapis.com/revoke'
        && $request['token'] === 'refresh-123');
    expect(IntegrationConnection::query()->where('integration_key', 'gmail')->exists())->toBeFalse();
});
