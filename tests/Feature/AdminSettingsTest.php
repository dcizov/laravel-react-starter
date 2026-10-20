<?php

use App\Models\User;
use App\Settings\AppSettings;
use App\Support\Rbac;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Pages are rendered without a built Vite manifest, so the test does not
    // depend on whether `npm run build` has been run since the page was added.
    $this->withoutVite();

    Rbac::sync();
});

function adminSettingsAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('an admin can open the admin settings page', function () {
    $this->actingAs(adminSettingsAdmin())
        ->get(route('admin-settings.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/admin')
            ->where('settings.app_name', config('app.name'))
            ->where('settings.default_role', 'user')
            ->has('roles'));
});

test('a user without settings.manage cannot open or save admin settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('admin-settings.edit'))->assertForbidden();

    $this->actingAs($user)
        ->patch(route('admin-settings.update'), ['app_name' => 'Hacked', 'default_role' => 'user'])
        ->assertForbidden();

    expect(app(AppSettings::class)->app_name)->toBe(config('app.name'));
});

test('an admin can change the application name and it is shared with every page', function () {
    $admin = adminSettingsAdmin();

    $this->actingAs($admin)
        ->patch(route('admin-settings.update'), ['app_name' => 'Tasks Hub', 'default_role' => 'user'])
        ->assertRedirect(route('admin-settings.edit'));

    expect(app(AppSettings::class)->app_name)->toBe('Tasks Hub');

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('name', 'Tasks Hub'));
});

test('the application name is required and limited in length', function () {
    $this->actingAs(adminSettingsAdmin())
        ->patch(route('admin-settings.update'), ['app_name' => '', 'default_role' => 'user'])
        ->assertSessionHasErrors('app_name');

    $this->actingAs(adminSettingsAdmin())
        ->patch(route('admin-settings.update'), ['app_name' => str_repeat('a', 101), 'default_role' => 'user'])
        ->assertSessionHasErrors('app_name');
});

test('the default role must be an existing role', function () {
    $this->actingAs(adminSettingsAdmin())
        ->patch(route('admin-settings.update'), ['app_name' => 'Hub', 'default_role' => 'missing'])
        ->assertSessionHasErrors('default_role');
});

test('new accounts get the default role chosen in admin settings', function () {
    Role::findOrCreate('editor');

    $this->actingAs(adminSettingsAdmin())
        ->patch(route('admin-settings.update'), ['app_name' => config('app.name'), 'default_role' => 'editor'])
        ->assertSessionHasNoErrors();

    $newUser = User::factory()->create();

    expect($newUser->hasRole('editor'))->toBeTrue()
        ->and($newUser->hasRole('user'))->toBeFalse();
});

test('the default role cannot be deleted while it is the default', function () {
    Role::findOrCreate('editor');

    $this->actingAs(adminSettingsAdmin())
        ->patch(route('admin-settings.update'), ['app_name' => config('app.name'), 'default_role' => 'editor'])
        ->assertSessionHasNoErrors();

    $this->actingAs(adminSettingsAdmin())
        ->delete(route('admin.roles.destroy', Role::findByName('editor')))
        ->assertSessionHasErrors('role');

    expect(Role::where('name', 'editor')->exists())->toBeTrue();
});

test('an admin can upload a logo and it is shared with every page', function () {
    Storage::fake('public');
    $admin = adminSettingsAdmin();

    $this->actingAs($admin)
        ->patch(route('admin-settings.update'), [
            'app_name' => config('app.name'),
            'default_role' => 'user',
            'logo' => UploadedFile::fake()->image('logo.png', 120, 120),
        ])
        ->assertRedirect(route('admin-settings.edit'));

    $path = app(AppSettings::class)->app_logo_path;

    expect($path)->not->toBeNull();
    Storage::disk('public')->assertExists($path);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('appLogoUrl', Storage::disk('public')->url($path)));
});

test('replacing the logo deletes the old file', function () {
    Storage::fake('public');
    $admin = adminSettingsAdmin();

    $this->actingAs($admin)->patch(route('admin-settings.update'), [
        'app_name' => config('app.name'),
        'default_role' => 'user',
        'logo' => UploadedFile::fake()->image('first.png', 120, 120),
    ]);
    $first = app(AppSettings::class)->app_logo_path;

    $this->actingAs($admin)->patch(route('admin-settings.update'), [
        'app_name' => config('app.name'),
        'default_role' => 'user',
        'logo' => UploadedFile::fake()->image('second.png', 120, 120),
    ]);
    $second = app(AppSettings::class)->app_logo_path;

    expect($second)->not->toBe($first);
    Storage::disk('public')->assertMissing($first);
    Storage::disk('public')->assertExists($second);
});

test('removing the logo deletes the file and falls back to the default mark', function () {
    Storage::fake('public');
    $admin = adminSettingsAdmin();

    $this->actingAs($admin)->patch(route('admin-settings.update'), [
        'app_name' => config('app.name'),
        'default_role' => 'user',
        'logo' => UploadedFile::fake()->image('logo.png', 120, 120),
    ]);
    $path = app(AppSettings::class)->app_logo_path;

    $this->actingAs($admin)
        ->patch(route('admin-settings.update'), [
            'app_name' => config('app.name'),
            'default_role' => 'user',
            'remove_logo' => true,
        ])
        ->assertSessionHasNoErrors();

    Storage::disk('public')->assertMissing($path);
    expect(app(AppSettings::class)->app_logo_path)->toBeNull();
});

test('the logo must be a png, jpeg, or webp image of at most 2 MB', function () {
    Storage::fake('public');
    $admin = adminSettingsAdmin();

    // SVG is refused on purpose: it can carry scripts.
    $this->actingAs($admin)
        ->patch(route('admin-settings.update'), [
            'app_name' => config('app.name'),
            'default_role' => 'user',
            'logo' => UploadedFile::fake()->create('logo.svg', 10, 'image/svg+xml'),
        ])
        ->assertSessionHasErrors('logo');

    $this->actingAs($admin)
        ->patch(route('admin-settings.update'), [
            'app_name' => config('app.name'),
            'default_role' => 'user',
            'logo' => UploadedFile::fake()->image('logo.png', 120, 120)->size(3000),
        ])
        ->assertSessionHasErrors('logo');

    expect(app(AppSettings::class)->app_logo_path)->toBeNull();
});
