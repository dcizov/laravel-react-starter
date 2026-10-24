<?php

declare(strict_types=1);

use App\Models\Page;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->assignRole('Admin');

    $this->editor = User::factory()->create();
    $this->editor->assignRole('Editor');

    $this->author = User::factory()->create();
    $this->author->assignRole('Author');
});

it('lists pages with counts and filters', function () {
    Page::factory()->count(2)->create();
    Page::factory()->published()->create();

    $this->actingAs($this->admin)
        ->get('/admin/pages')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/pages/index')
            ->has('pages.data', 3)
            ->where('counts.published', 1)
            ->where('counts.draft', 2));

    $this->actingAs($this->admin)
        ->get('/admin/pages?status=published')
        ->assertInertia(fn ($page) => $page->has('pages.data', 1));
});

it('creates a page with a hero section and an initial revision', function () {
    $this->actingAs($this->author)
        ->post('/admin/pages', ['title' => 'Our Services'])
        ->assertRedirect();

    $page = Page::first();

    expect($page)->not->toBeNull()
        ->and($page->slug)->toBe('our-services')
        ->and($page->status)->toBe('draft')
        ->and($page->author_id)->toBe($this->author->id)
        ->and($page->content[0]['section'])->toBe('hero')
        ->and($page->revisions()->count())->toBe(1);
});

it('validates required section fields from the registry', function () {
    $page = Page::factory()->create();

    $this->actingAs($this->admin)
        ->patch("/admin/pages/{$page->id}", [
            'content' => [
                ['id' => 'a', 'section' => 'hero', 'enabled' => true, 'content' => ['heading' => '']],
            ],
        ])
        ->assertSessionHasErrors('content.0.content.heading');
});

it('rejects unknown sections and normalises the rest', function () {
    $page = Page::factory()->create();

    $this->actingAs($this->admin)
        ->patch("/admin/pages/{$page->id}", [
            'title' => 'Renamed',
            'content' => [
                ['id' => 'a', 'section' => 'not-a-section', 'enabled' => true, 'content' => []],
                ['id' => 'b', 'section' => 'cta', 'enabled' => true, 'content' => ['heading' => 'Talk to us']],
            ],
        ])
        ->assertSessionHasNoErrors();

    $page->refresh();

    expect($page->title)->toBe('Renamed')
        ->and($page->content)->toHaveCount(1)
        ->and($page->content[0]['section'])->toBe('cta')
        // defaults are filled in for keys the editor did not send
        ->and($page->content[0]['content']['button_label'])->toBe('')
        ->and($page->version)->toBe(2);
});

it('renders the editor with the section schema and a signed preview url', function () {
    $page = Page::factory()->create();

    $this->actingAs($this->editor)
        ->get("/admin/pages/{$page->id}/edit")
        ->assertOk()
        ->assertInertia(fn ($inertia) => $inertia
            ->component('admin/pages/edit')
            ->where('page.id', $page->id)
            ->has('sections', 4)
            ->where('sections.0.key', 'hero')
            ->has('revisions', 1)
            ->where('can.publish', true));
});

it('autosaves without a redirect and reports the new version', function () {
    $page = Page::factory()->create();

    $this->actingAs($this->editor)
        ->patchJson("/admin/pages/{$page->id}/autosave", ['title' => 'Autosaved title'])
        ->assertOk()
        ->assertJsonStructure(['saved_at', 'version', 'slug']);

    expect($page->refresh()->title)->toBe('Autosaved title')
        ->and($page->revisions()->first()->label)->toBe('Autosaved');
});

it('publishes and unpublishes', function () {
    $page = Page::factory()->create();

    $this->actingAs($this->editor)->post("/admin/pages/{$page->id}/publish")->assertRedirect();

    expect($page->refresh()->status)->toBe('published')
        ->and($page->published_at)->not->toBeNull();

    $this->actingAs($this->editor)->post("/admin/pages/{$page->id}/unpublish")->assertRedirect();

    expect($page->refresh()->status)->toBe('draft')
        ->and($page->published_at)->toBeNull();
});

it('refuses to publish as an author', function () {
    $page = Page::factory()->create(['author_id' => $this->author->id]);

    $this->actingAs($this->author)->post("/admin/pages/{$page->id}/publish")->assertForbidden();
});

it('schedules a page in the future only', function () {
    $page = Page::factory()->create();

    $this->actingAs($this->editor)
        ->post("/admin/pages/{$page->id}/schedule", ['scheduled_at' => now()->subHour()->toIso8601String()])
        ->assertSessionHasErrors('scheduled_at');

    $this->actingAs($this->editor)
        ->post("/admin/pages/{$page->id}/schedule", ['scheduled_at' => now()->addDay()->toIso8601String()])
        ->assertSessionHasNoErrors();

    expect($page->refresh()->status)->toBe('scheduled')
        ->and($page->scheduled_at)->not->toBeNull();
});

it('duplicates a page as a draft copy', function () {
    $page = Page::factory()->published()->create(['title' => 'About']);

    $this->actingAs($this->editor)->post("/admin/pages/{$page->id}/duplicate")->assertRedirect();

    $copy = Page::where('id', '!=', $page->id)->first();

    expect($copy->title)->toBe('About (copy)')
        ->and($copy->slug)->toBe('about-copy')
        ->and($copy->status)->toBe('draft')
        ->and($copy->content)->toBe($page->content);
});

it('soft deletes, lists in trash and restores', function () {
    $page = Page::factory()->create();

    $this->actingAs($this->editor)->delete("/admin/pages/{$page->id}")->assertRedirect();

    expect(Page::count())->toBe(0)->and(Page::onlyTrashed()->count())->toBe(1);

    $this->actingAs($this->editor)
        ->get('/admin/pages?trashed=1')
        ->assertInertia(fn ($page) => $page->has('pages.data', 1));

    $this->actingAs($this->editor)->post("/admin/pages/{$page->id}/restore")->assertRedirect();

    expect(Page::count())->toBe(1)->and($page->refresh()->deleted_at)->toBeNull();
});

it('restores a revision and snapshots the current state first', function () {
    $page = Page::factory()->create(['title' => 'Original']);
    $revision = $page->revisions()->first();

    $this->actingAs($this->editor)
        ->patch("/admin/pages/{$page->id}", ['title' => 'Changed'])
        ->assertSessionHasNoErrors();

    $this->actingAs($this->editor)
        ->post("/admin/pages/{$page->id}/revisions/{$revision->id}/restore")
        ->assertRedirect();

    expect($page->refresh()->title)->toBe('Original')
        ->and($page->revisions()->where('label', 'Before restore')->exists())->toBeTrue();
});
