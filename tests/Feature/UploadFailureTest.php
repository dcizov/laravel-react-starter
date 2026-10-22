<?php

use App\Models\User;
use App\Settings\AppSettings;
use App\Support\PublicUploads;
use App\Support\Rbac;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

// Storage::putFileAs() returns false when a write fails. These tests stand in a public disk that does that,
// and check that no upload path stores an empty path or leaves the record changed.

beforeEach(function () {
    Rbac::sync();
});

/**
 * A public disk whose writes all fail, the way putFileAs() reports a failed write.
 * url() is allowed too: HandleInertiaRequests::share() builds the logo URL on every request, so a
 * request made while a logo path is set would otherwise fail on the mock before the upload runs.
 */
function failingPublicDisk(): void
{
    $disk = Mockery::mock(FilesystemAdapter::class);
    $disk->shouldReceive('putFileAs')->andReturn(false);
    $disk->shouldReceive('exists')->andReturn(false);
    $disk->shouldReceive('url')->andReturnUsing(fn (string $path) => '/storage/'.$path);

    Storage::set('public', $disk);
}

function uploadTestAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('a successful upload is stored and returns its path', function () {
    Storage::fake('public');

    $path = PublicUploads::store(UploadedFile::fake()->image('logo.png', 120, 120), 'branding');

    expect($path)->toStartWith('branding/');
    Storage::disk('public')->assertExists($path);
});

test('a failed write returns null and removes the partial file it left', function () {
    Log::spy();

    $disk = Mockery::mock(FilesystemAdapter::class);
    $disk->shouldReceive('putFileAs')->once()->andReturn(false);
    $disk->shouldReceive('exists')->once()->andReturn(true);
    $disk->shouldReceive('delete')->once()->andReturn(true);
    Storage::set('public', $disk);

    expect(PublicUploads::store(UploadedFile::fake()->image('logo.png'), 'branding'))->toBeNull();

    Log::shouldHaveReceived('error')->once()->with(
        'An uploaded file could not be saved.',
        Mockery::on(fn (array $context) => $context['disk'] === 'public' && $context['directory'] === 'branding'),
    );
});

test('a failed logo upload reports an error and keeps the current logo', function () {
    Log::spy();
    failingPublicDisk();

    $settings = app(AppSettings::class);
    $settings->app_logo_path = 'branding/current.png';
    $settings->save();

    $this->actingAs(uploadTestAdmin())
        ->patch(route('admin-settings.update'), [
            'app_name' => config('app.name'),
            'default_role' => 'user',
            'logo' => UploadedFile::fake()->image('logo.png', 120, 120),
        ])
        ->assertRedirect()
        ->assertSessionHasErrors(['logo' => 'The file could not be saved. Please try again.']);

    expect(app(AppSettings::class)->app_logo_path)->toBe('branding/current.png');
    Log::shouldHaveReceived('error')->once();
});

test('a failed avatar upload reports an error and does not save an empty path', function () {
    Log::spy();
    failingPublicDisk();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => UploadedFile::fake()->image('avatar.jpg', 200, 200),
        ])
        ->assertSessionHasErrors(['avatar' => 'The file could not be saved. Please try again.']);

    expect($user->fresh()->avatar_path)->toBeNull();
    Log::shouldHaveReceived('error')->once();
});

test('a failed header upload reports an error and does not save an empty path', function () {
    Log::spy();
    failingPublicDisk();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'header' => UploadedFile::fake()->image('header.jpg', 1200, 300),
        ])
        ->assertSessionHasErrors(['header' => 'The file could not be saved. Please try again.']);

    expect($user->fresh()->header_path)->toBeNull();
    Log::shouldHaveReceived('error')->once();
});

test('a failed header upload removes the avatar stored in the same request', function () {
    Log::spy();

    $disk = Mockery::mock(FilesystemAdapter::class);
    $disk->shouldReceive('putFileAs')->twice()->andReturn('avatars/new.jpg', false);
    $disk->shouldReceive('exists')->andReturn(false);
    $disk->shouldReceive('delete')->once()->with('avatars/new.jpg')->andReturn(true);
    Storage::set('public', $disk);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => UploadedFile::fake()->image('avatar.jpg', 200, 200),
            'header' => UploadedFile::fake()->image('header.jpg', 1200, 300),
        ])
        ->assertSessionHasErrors(['header' => 'The file could not be saved. Please try again.']);

    expect($user->fresh()->avatar_path)->toBeNull();
});

test('a failed landing image upload returns a validation error and no url', function () {
    Log::spy();
    failingPublicDisk();

    $this->actingAs(uploadTestAdmin())
        ->postJson(route('admin.landing.images.store'), [
            'image' => UploadedFile::fake()->image('hero.png'),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['image' => 'The file could not be saved. Please try again.'])
        ->assertJsonMissingPath('url');

    Log::shouldHaveReceived('error')->once();
});

test('a successful landing image upload returns its url', function () {
    Storage::fake('public');

    $this->actingAs(uploadTestAdmin())
        ->postJson(route('admin.landing.images.store'), [
            'image' => UploadedFile::fake()->image('hero.png'),
        ])
        ->assertOk()
        ->assertJsonPath('url', fn ($url) => str_starts_with($url, '/storage/landing/'));
});

test('a failed cms image upload returns a validation error and no url', function () {
    Log::spy();
    failingPublicDisk();

    $this->actingAs(uploadTestAdmin())
        ->postJson(route('admin.cms.images.store'), [
            'image' => UploadedFile::fake()->image('photo.png'),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['image' => 'The file could not be saved. Please try again.'])
        ->assertJsonMissingPath('url');

    Log::shouldHaveReceived('error')->once();
});
