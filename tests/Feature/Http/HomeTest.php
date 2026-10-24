<?php

declare(strict_types=1);

use App\Cms\Content\Homepage;
use App\Cms\Pages\Slugger;
use App\Cms\Repositories\ThemeRepository;
use App\Cms\Settings\SettingRepository;
use App\Models\Page;
use App\Models\PageSlug;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

it('returns a successful response', function () {
    $this->get(route('home'))->assertOk();
});

it('serves the configured homepage instead of one that happens to be called home', function () {
    Page::factory()->published()->create(['slug' => 'home', 'title' => 'Old home']);
    Page::factory()->published()->create(['slug' => 'studio', 'title' => 'Studio']);

    app(SettingRepository::class)->put('content', ['homepage_slug' => 'studio']);

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($inertia) => $inertia
            ->component('public/page')
            ->where('page.slug', 'studio')
            ->where('page.title', 'Studio'));
});

it('falls back to the core landing page when the configured homepage is not published', function () {
    Page::factory()->create(['slug' => 'home', 'title' => 'Draft home']);

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($inertia) => $inertia->component('welcome'));
});

it('leaves the landing page in place when the homepage is only scheduled', function () {
    Page::factory()->scheduled()->create(['slug' => 'home']);

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($inertia) => $inertia->component('welcome'));
});

it('ignores a trashed homepage', function () {
    $page = Page::factory()->published()->create(['slug' => 'home']);
    $page->delete();

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($inertia) => $inertia->component('welcome'));
});

it('keeps serving the homepage after a slug rename through the admin', function () {
    $page = Page::factory()->published()->create(['slug' => 'home', 'title' => 'Home']);

    // A rename records the old slug for redirects; the homepage setting still
    // points at the page it names, so / must not silently lose its page.
    app(Slugger::class)->rename($page, 'start');
    app(SettingRepository::class)->put('content', ['homepage_slug' => 'start']);

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($inertia) => $inertia
            ->component('public/page')
            ->where('page.slug', 'start'));
});

it('keeps resolving the same homepage across requests, whatever else is in the table', function () {
    $home = Page::factory()->published()->create(['slug' => 'home', 'title' => 'Home']);
    Page::factory()->create(['slug' => 'about']);
    PageSlug::query()->create(['page_id' => $home->id, 'slug' => 'start']);

    $first = $this->get('/')->assertInertia(fn ($inertia) => $inertia->component('public/page'));
    $second = $this->get('/')->assertInertia(fn ($inertia) => $inertia->component('public/page'));

    expect($second->status())->toBe($first->status());
});

it('falls back to the default slug when the setting is malformed', function () {
    Page::factory()->published()->create(['slug' => 'home']);

    app(SettingRepository::class)->put('content', ['homepage_slug' => 'Home Page!']);

    expect(app(Homepage::class)->slug())->toBe('home');

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($inertia) => $inertia->component('public/page'));
});

it('writes / for the configured homepage in the sitemap', function () {
    foreach (app(ThemeRepository::class)->discovered() as $manifest) {
        app(ThemeRepository::class)->install($manifest);
    }

    Page::factory()->published()->create(['slug' => 'studio', 'title' => 'Studio']);
    app(SettingRepository::class)->put('content', ['homepage_slug' => 'studio']);

    $response = $this->get('/sitemap.xml')->assertOk();

    expect($response->getContent())
        ->toContain('<loc>'.url('/').'</loc>')
        ->not->toContain('<loc>'.url('/studio').'</loc>');
});
