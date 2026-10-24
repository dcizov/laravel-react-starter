<?php

declare(strict_types=1);

use App\Cms\Media\MediaLibrary;
use App\Cms\Settings\SettingRepository;
use App\Cms\Settings\SettingSchema;
use App\Models\Page;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Activitylog\Models\Activity;

beforeEach(function () {
    Storage::fake('public');
    $this->seed(RolePermissionSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->assignRole('Admin');

    $this->editor = User::factory()->create();
    $this->editor->assignRole('Editor');

    $this->author = User::factory()->create();
    $this->author->assignRole('Author');
});

it('renders a settings group from the schema', function () {
    $this->actingAs($this->admin)
        ->get('/admin/settings')
        ->assertRedirect('/admin/settings/general');

    $this->actingAs($this->admin)
        ->get('/admin/settings/general')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/settings/index')
            ->where('group.key', 'general')
            ->where('can.update', true)
            ->has('groups', count(SettingSchema::handles()))
            ->where('groups.0.key', 'general')
            ->where('group.fields.0.key', 'site_name')
            ->where('group.fields.0.type', 'string'));
});

it('shows the screen to editors and hides it from authors', function () {
    $this->actingAs($this->editor)->get('/admin/settings/mail')->assertOk();

    $this->actingAs($this->author)->get('/admin/settings')->assertForbidden();
    $this->actingAs($this->author)->get('/admin/settings/general')->assertForbidden();
    $this->actingAs($this->author)->patch('/admin/settings/general', ['site_name' => 'Nope'])->assertForbidden();
});

it('saves a group and the public site reports the new identity', function () {
    $page = Page::factory()->published()->create(['slug' => 'services', 'title' => 'Services']);

    $this->actingAs($this->admin)
        ->patch('/admin/settings/general', [
            'site_name' => 'Papertrail Press',
            'tagline' => 'Print, slowly',
            'description' => 'A letterpress studio in Hannover.',
            'locale' => 'de',
            'timezone' => 'Europe/Berlin',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(Setting::query()->where('key', 'site_name')->value('group'))->toBe('general')
        ->and(app(SettingRepository::class)->publicValues()['name'])->toBe('Papertrail Press');

    // The provider does this at boot; the test calls it directly because the
    // application has already booted inside this process.
    app(SettingRepository::class)->applyToConfig();

    $this->get('/'.$page->slug)
        ->assertOk()
        ->assertInertia(fn ($inertia) => $inertia
            ->where('site.name', 'Papertrail Press')
            ->where('settings.public.name', 'Papertrail Press')
            ->where('settings.public.locale', 'de'));
});

it('saves a logo and exposes its url to the public chrome', function () {
    $page = Page::factory()->published()->create(['slug' => 'about', 'title' => 'About']);

    $media = app(MediaLibrary::class)->store(
        UploadedFile::fake()->image('wordmark.png', 400, 120),
        null,
        $this->admin,
    );

    $this->actingAs($this->admin)
        ->patch('/admin/settings/branding', ['logo' => $media->id])
        ->assertSessionHasNoErrors();

    $this->get('/'.$page->slug)
        ->assertOk()
        ->assertInertia(fn ($inertia) => $inertia->where('settings.public.logo', $media->url()));
});

it('validates every field by its declared type', function () {
    $this->actingAs($this->admin)
        ->patch('/admin/settings/content', ['posts_per_page' => 'lots'])
        ->assertSessionHasErrors('posts_per_page');

    $this->actingAs($this->admin)
        ->patch('/admin/settings/seo', ['robots' => 'sometimes'])
        ->assertSessionHasErrors('robots');

    $this->actingAs($this->admin)
        ->patch('/admin/settings/mail', ['from_address' => 'not-an-address'])
        ->assertSessionHasErrors('from_address');

    $this->actingAs($this->admin)
        ->patch('/admin/settings/general', ['site_name' => ''])
        ->assertSessionHasErrors('site_name');

    expect(Setting::query()->count())->toBe(0);
});

it('saves a single switch without touching the rest of the group', function () {
    $this->actingAs($this->admin)
        ->patch('/admin/settings/content', ['allow_comments' => true])
        ->assertSessionHasNoErrors();

    $public = app(SettingRepository::class)->publicValues();

    expect($public['allow_comments'])->toBeTrue()
        ->and($public['posts_per_page'])->toBe(9)
        ->and(Setting::query()->count())->toBe(1);
});

it('keeps a stored secret out of the browser and out of the database', function () {
    $this->actingAs($this->admin)
        ->patch('/admin/settings/mail', [
            'from_address' => 'studio@lattice.test',
            'transport' => 'smtp',
            'password' => 'letterpress-2026',
        ])
        ->assertSessionHasNoErrors();

    $raw = (string) Setting::query()->where('key', 'password')->value('value');

    expect($raw)->not->toContain('letterpress-2026')
        ->and(app(SettingRepository::class)->values('mail')['password'])->toBe('letterpress-2026');

    $this->actingAs($this->admin)
        ->get('/admin/settings/mail')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('group.fields.7.key', 'password')
            ->where('group.fields.7.value', null)
            ->where('group.fields.7.has_value', true));

    // Saving the group again with a blank password keeps the stored one.
    $this->actingAs($this->admin)
        ->patch('/admin/settings/mail', ['from_address' => 'hello@lattice.test', 'password' => ''])
        ->assertSessionHasNoErrors();

    expect(app(SettingRepository::class)->values('mail')['password'])->toBe('letterpress-2026');
});

it('404s an unknown group', function () {
    $this->actingAs($this->admin)->get('/admin/settings/nope')->assertNotFound();
    $this->actingAs($this->admin)->patch('/admin/settings/nope', ['site_name' => 'X'])->assertNotFound();
});

it('records a setting change in the activity log', function () {
    $this->actingAs($this->admin)
        ->patch('/admin/settings/general', ['site_name' => 'Papertrail Press'])
        ->assertSessionHasNoErrors();

    $activity = Activity::query()->where('log_name', 'settings')->latest('id')->first();

    expect($activity)->not->toBeNull()
        ->and($activity->description)->toBe('Updated general settings')
        ->and($activity->causer_id)->toBe($this->admin->id);
});
