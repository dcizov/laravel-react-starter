<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

test('user profile page is displayed with the user details', function () {
    $user = User::factory()->create([
        'bio' => 'Builds Laravel apps.',
        'job_title' => 'Developer',
        'company' => 'Acme',
        'location' => 'Hannover',
        'website' => 'https://example.com',
    ]);

    $this->actingAs($user)
        ->get(route('user-profile.show'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('user-profile')
            ->where('auth.user.bio', 'Builds Laravel apps.')
            ->where('auth.user.job_title', 'Developer')
            ->where('auth.user.company', 'Acme')
            ->where('auth.user.location', 'Hannover')
            ->where('auth.user.website', 'https://example.com'));
});

test('guests are redirected from the user profile page', function () {
    $this->get(route('user-profile.show'))
        ->assertRedirect(route('login'));
});

test('profile picture can be uploaded', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => UploadedFile::fake()->image('avatar.jpg', 200, 200),
        ])
        ->assertSessionHasNoErrors();

    $user->refresh();

    expect($user->avatar_path)->toStartWith('avatars/');
    Storage::disk('public')->assertExists($user->avatar_path);
    expect($user->avatar_url)->toBe(Storage::disk('public')->url($user->avatar_path));
});

test('profile picture must be an image of at most 2 MB', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
        ])
        ->assertSessionHasErrors('avatar');

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => UploadedFile::fake()->image('huge.jpg')->size(2049),
        ])
        ->assertSessionHasErrors('avatar');
});

test('profile picture can be removed', function () {
    $user = User::factory()->create();
    $path = Storage::disk('public')->put('avatars', UploadedFile::fake()->image('old.jpg'));
    $user->update(['avatar_path' => $path]);

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'remove_avatar' => true,
        ])
        ->assertSessionHasNoErrors();

    $user->refresh();

    expect($user->avatar_path)->toBeNull();
    expect($user->avatar_url)->toBeNull();
    Storage::disk('public')->assertMissing($path);
});

test('website must be a valid http or https url', function (string $website) {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'website' => $website,
        ])
        ->assertSessionHasErrors('website');
})->with([
    'javascript scheme' => 'javascript:alert(1)',
    'ftp scheme' => 'ftp://example.com',
    'plain text' => 'not a url',
]);

test('website accepts an https url', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'website' => 'https://example.com/about',
        ])
        ->assertSessionHasNoErrors();

    expect($user->refresh()->website)->toBe('https://example.com/about');
});

test('bio may be at most 500 characters', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'bio' => str_repeat('a', 501),
        ])
        ->assertSessionHasErrors('bio');

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'bio' => str_repeat('a', 500),
        ])
        ->assertSessionHasNoErrors();
});
