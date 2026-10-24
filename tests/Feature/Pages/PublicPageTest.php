<?php

use App\Models\Page;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\URL;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->assignRole('Admin');
});

it('serves a published page at its slug', function () {
    Page::factory()->published()->create(['title' => 'Services', 'slug' => 'services']);

    $this->get('/services')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/page')
            ->where('page.title', 'Services')
            ->where('page.slug', 'services'));
});

it('hides drafts behind a 404', function () {
    Page::factory()->create(['slug' => 'secret']);

    $this->get('/secret')->assertNotFound();
});

it('does not serve a scheduled page before its time', function () {
    Page::factory()->scheduled()->create(['slug' => 'later']);

    $this->get('/later')->assertNotFound();
});

it('redirects an old slug to the new one with a 301', function () {
    $page = Page::factory()->published()->create(['slug' => 'contact']);

    $this->actingAs($this->admin)
        ->patch("/admin/pages/{$page->id}", ['slug' => 'get-in-touch'])
        ->assertSessionHasNoErrors();

    expect($page->refresh()->slug)->toBe('get-in-touch')
        ->and($page->slugs()->pluck('slug')->all())->toBe(['contact']);

    $this->get('/contact')
        ->assertStatus(301)
        ->assertRedirect('/get-in-touch');

    $this->get('/get-in-touch')->assertOk();
});

it('never lets a historical slug be reused', function () {
    $page = Page::factory()->published()->create(['slug' => 'about']);
    $other = Page::factory()->published()->create(['slug' => 'team']);

    $this->actingAs($this->admin)->patch("/admin/pages/{$page->id}", ['slug' => 'studio']);

    $this->actingAs($this->admin)->patch("/admin/pages/{$other->id}", ['slug' => 'about']);

    expect($other->refresh()->slug)->not->toBe('about');
});

it('previews a draft through a signed url only', function () {
    $page = Page::factory()->create(['title' => 'Draft only']);

    $signed = URL::temporarySignedRoute('preview.pages.show', now()->addHour(), ['page' => $page]);

    $this->get($signed)
        ->assertOk()
        ->assertInertia(fn ($response) => $response
            ->component('preview/page')
            ->where('page.title', 'Draft only'));

    $this->get(route('preview.pages.show', $page))->assertForbidden();

    $this->get(URL::temporarySignedRoute('preview.pages.show', now()->subHour(), ['page' => $page]))
        ->assertForbidden();
});

it('renders the landing page for guests', function () {
    $this->get('/')->assertOk();
});
