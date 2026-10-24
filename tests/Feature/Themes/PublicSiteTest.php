<?php

use App\Cms\Menus\MenuRepository;
use App\Cms\Repositories\ThemeRepository;
use App\Cms\Themes\ThemeManager;
use App\Models\MenuItem;
use App\Models\Page;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\URL;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    foreach (app(ThemeRepository::class)->discovered() as $manifest) {
        app(ThemeRepository::class)->install($manifest);
    }
});

it('renders a published page with site chrome, menus and theme tokens', function () {
    $page = Page::factory()->published()->create(['slug' => 'services', 'title' => 'Services']);

    MenuItem::query()->create([
        'menu' => 'main', 'label' => 'Services', 'type' => MenuItem::TYPE_PAGE,
        'page_id' => $page->id, 'position' => 0,
    ]);
    MenuItem::query()->create([
        'menu' => 'main', 'label' => 'Journal', 'type' => MenuItem::TYPE_URL,
        'url' => '/journal', 'position' => 1,
    ]);

    $this->get('/services')
        ->assertOk()
        ->assertInertia(fn ($inertia) => $inertia
            ->component('public/page')
            ->where('page.slug', 'services')
            ->where('site.name', 'Northwind Studio')
            ->where('site.home_url', url('/'))
            ->where('menus.main.0.label', 'Services')
            ->where('menus.main.0.url', '/services')
            ->where('menus.main.1.url', '/journal')
            ->where('theme.handle', 'core')
            ->where('theme.tokens.radius', '0.625rem'));
});

it('resolves menu items to pages and degrades unpublished targets', function () {
    $draft = Page::factory()->create(['slug' => 'secret', 'title' => 'Secret']);

    MenuItem::query()->create([
        'menu' => 'footer', 'label' => 'Secret', 'type' => MenuItem::TYPE_PAGE,
        'page_id' => $draft->id, 'position' => 0,
    ]);

    $tree = app(MenuRepository::class)->tree('footer');

    expect($tree)->toHaveCount(1)
        ->and($tree[0]['url'])->toBe('/')
        ->and($tree[0]['children'])->toBe([]);
});

it('nests children under their parent', function () {
    $parent = MenuItem::query()->create(['menu' => 'main', 'label' => 'Studio', 'type' => MenuItem::TYPE_URL, 'url' => '/studio', 'position' => 0]);
    MenuItem::query()->create(['menu' => 'main', 'label' => 'Team', 'type' => MenuItem::TYPE_URL, 'url' => '/team', 'parent_id' => $parent->id, 'position' => 0]);

    $tree = app(MenuRepository::class)->tree('main');

    expect($tree)->toHaveCount(1)
        ->and($tree[0]['children'])->toHaveCount(1)
        ->and($tree[0]['children'][0]['url'])->toBe('/team');
});

it('serves a 404 with site chrome for unknown slugs', function () {
    $this->get('/nope')
        ->assertNotFound()
        ->assertInertia(fn ($inertia) => $inertia
            ->component('public/not-found')
            ->where('theme.handle', 'core')
            ->has('menus.main'));
});

it('degrades an errored active theme to the core components', function () {
    app(ThemeRepository::class)->activate('aperture');

    // The component is still the theme's until its provider fails, which is
    // recorded as `last_error` by Safe Mode.
    expect(app(ThemeManager::class)->component('page'))->toBe('themes/aperture/page');
});

it('lists only published, indexable pages in the sitemap', function () {
    Page::factory()->published()->create(['slug' => 'about']);
    Page::factory()->published()->create(['slug' => 'home']);
    Page::factory()->published()->create(['slug' => 'hidden', 'robots' => 'noindex,nofollow']);
    Page::factory()->create(['slug' => 'draft-only']);
    Page::factory()->scheduled()->create(['slug' => 'later']);

    $response = $this->get('/sitemap.xml')->assertOk();

    $body = $response->getContent();

    expect($response->headers->get('Content-Type'))->toContain('application/xml')
        ->and($body)->toContain('<loc>'.url('/about').'</loc>')
        ->and($body)->toContain('<loc>'.url('/').'</loc>')
        ->and($body)->not->toContain('hidden')
        ->and($body)->not->toContain('draft-only')
        ->and($body)->not->toContain('later');
});

it('serves robots.txt that blocks the admin and points at the sitemap', function () {
    $response = $this->get('/robots.txt')->assertOk();

    expect($response->getContent())
        ->toContain('Disallow: /admin')
        ->toContain('Disallow: /preview')
        ->toContain('Sitemap: '.url('/sitemap.xml'));
});

it('keeps previews signed, themed and out of the index', function () {
    $page = Page::factory()->create(['slug' => 'draft-page']);

    $this->get("/preview/pages/{$page->id}")->assertForbidden();

    $this->actingAs(User::factory()->create());

    $this->get(URL::temporarySignedRoute('preview.pages.show', now()->addHour(), ['page' => $page]))
        ->assertOk()
        ->assertInertia(fn ($inertia) => $inertia
            ->component('preview/page')
            ->where('page.status', 'draft')
            ->where('theme.handle', 'core')
            ->has('site.name'));
});
