<?php

use App\Models\User;
use App\Settings\AppSettings;
use App\Support\ErrorPages;
use App\Support\LandingBlocks;
use App\Support\Rbac;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Rbac::sync();
});

function landingAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

function block(string $id, string $type, array $data): array
{
    return ['id' => $id, 'type' => $type, 'data' => $data];
}

test('the home page shows the default landing page when it is switched on', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->where('preview', false)
            ->where('blocks.0.type', 'hero'));
});

test('with the landing page switched off, guests go to login and users go to the dashboard', function () {
    $settings = app(AppSettings::class);
    $settings->landing_enabled = false;
    $settings->save();

    $this->get('/')->assertRedirect(route('login'));

    $this->actingAs(User::factory()->create())
        ->get('/')
        ->assertRedirect(route('dashboard'));
});

test('a user without landing.manage cannot open the editor or the preview', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('admin.landing.index'))->assertForbidden();
    $this->actingAs($user)->get(route('admin.landing.preview'))->assertForbidden();
});

test('a draft keeps only the fields each block type allows', function () {
    $admin = landingAdmin();

    $this->actingAs($admin)
        ->put(route('admin.landing.draft.update'), ['blocks' => [
            block('hero-1', 'hero', ['title' => 'Hi', 'text' => 'There', 'onclick' => 'alert(1)']),
        ]])
        ->assertRedirect();

    $draft = app(AppSettings::class)->landing_draft;

    expect($draft[0]['data'])->toHaveKeys(['title', 'text'])
        ->and($draft[0]['data'])->not->toHaveKey('onclick');
});

test('links that are not http, https, or a site path are rejected', function (string $url) {
    $admin = landingAdmin();

    $this->actingAs($admin)
        ->put(route('admin.landing.draft.update'), ['blocks' => [
            block('button-1', 'button', ['label' => 'Click', 'url' => $url]),
        ]])
        ->assertSessionHasErrors('blocks.0.data.url');
})->with([
    'javascript' => ['javascript:alert(1)'],
    'data' => ['data:text/html;base64,PHNjcmlwdD4='],
    'protocol relative' => ['//evil.example.com'],
]);

test('an unknown block type is rejected', function () {
    $this->actingAs(landingAdmin())
        ->put(route('admin.landing.draft.update'), ['blocks' => [
            block('x-1', 'script', ['body' => 'x']),
        ]])
        ->assertSessionHasErrors('blocks.0.type');
});

test('publishing copies the draft to the public page, and discarding resets the draft', function () {
    $admin = landingAdmin();

    $this->actingAs($admin)
        ->put(route('admin.landing.draft.update'), ['blocks' => [
            block('text-1', 'text', ['heading' => 'New', 'body' => 'Published text']),
        ]]);

    $this->actingAs($admin)->post(route('admin.landing.publish'))->assertRedirect();

    $this->get('/')->assertInertia(fn ($page) => $page->where('blocks.0.data.body', 'Published text'));

    $this->actingAs($admin)
        ->put(route('admin.landing.draft.update'), ['blocks' => []]);

    $this->actingAs($admin)->post(route('admin.landing.discard'))->assertRedirect();

    expect(app(AppSettings::class)->landing_draft)->toEqual(app(AppSettings::class)->landing_published);
});

test('an empty draft is kept as empty instead of falling back to the published page', function () {
    $admin = landingAdmin();

    $this->actingAs($admin)->put(route('admin.landing.draft.update'), ['blocks' => []]);

    expect(app(AppSettings::class)->landing_draft)->toBe([]);
});

test('the preview shows the draft and is marked as a preview', function () {
    $admin = landingAdmin();

    $this->actingAs($admin)
        ->put(route('admin.landing.draft.update'), ['blocks' => [
            block('text-2', 'text', ['body' => 'Draft only']),
        ]]);

    $this->actingAs($admin)
        ->get(route('admin.landing.preview'))
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->where('preview', true)
            ->where('blocks.0.data.body', 'Draft only'));
});

test('images must be png, jpeg, or webp, and SVG is refused', function () {
    Storage::fake('public');
    $admin = landingAdmin();

    $this->actingAs($admin)
        ->postJson(route('admin.landing.images.store'), [
            'image' => UploadedFile::fake()->create('logo.svg', 10, 'image/svg+xml'),
        ])
        ->assertUnprocessable();

    $this->actingAs($admin)
        ->postJson(route('admin.landing.images.store'), [
            'image' => UploadedFile::fake()->image('hero.png'),
        ])
        ->assertOk()
        ->assertJsonPath('url', fn ($url) => str_starts_with($url, '/storage/landing/'));
});

test('the admin settings save the error-page and landing switches', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->patch(route('admin-settings.update'), [
            'app_name' => 'Test',
            'default_role' => Rbac::DEFAULT_ROLE,
            'custom_error_pages' => false,
            'landing_enabled' => false,
        ])
        ->assertRedirect();

    $settings = app(AppSettings::class);

    expect($settings->custom_error_pages)->toBeFalse()
        ->and($settings->landing_enabled)->toBeFalse()
        ->and(ErrorPages::enabled())->toBeFalse();
});

test('the built-in default blocks pass the same validation as admin blocks', function () {
    expect(LandingBlocks::validate(LandingBlocks::defaults()))->toEqual(LandingBlocks::defaults());
});
