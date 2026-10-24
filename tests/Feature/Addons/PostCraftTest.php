<?php

declare(strict_types=1);

use App\Addons\PostCraft\Models\Category;
use App\Addons\PostCraft\Models\Post;
use App\Addons\PostCraft\Models\Tag;
use App\Cms\Addons\AddonManager;
use App\Cms\Registries\Navigation;
use App\Cms\Repositories\AddonRepository;
use App\Cms\Sections\SectionRegistry;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->assignRole('Admin');

    $this->editor = User::factory()->create();
    $this->editor->assignRole('Editor');

    $this->author = User::factory()->create();
    $this->author->assignRole('Author');

    $this->repository = app(AddonRepository::class);
    $this->manager = app(AddonManager::class);

    $manifest = collect($this->repository->discovered())->firstWhere('handle', 'PostCraft');

    $this->repository->install($manifest);
    $this->manager->activate('PostCraft');

    bootNextRequest();
});

/**
 * Activating an addon inside one process registers its routes after the core
 * catch-all. A real request boots from the database, so the tests do the same.
 */
function bootNextRequest(): void
{
    test()->refreshApplication();
}

function draftFor(User $author, array $attributes = []): Post
{
    return Post::query()->create($attributes + [
        'title' => 'A post about paper',
        'slug' => 'a-post-about-paper',
        'excerpt' => 'Paper is a good idea.',
        'body' => 'Paper is a very good idea indeed.',
        'author_id' => $author->id,
        'status' => Post::STATUS_DRAFT,
    ]);
}

it('migrates its tables and grants each editorial role its post abilities', function () {
    expect(app(AddonRepository::class)->find('PostCraft')->status)->toBe('active')
        ->and(Schema::hasTable('posts'))->toBeTrue()
        ->and($this->editor->fresh()->can('posts.publish'))->toBeTrue()
        ->and($this->author->fresh()->can('posts.publish'))->toBeFalse()
        ->and($this->author->fresh()->can('posts.create'))->toBeTrue();
});

it('serves the blog index, a post page and the rss feed', function () {
    $category = Category::query()->create(['name' => 'Craft', 'slug' => 'craft']);
    $post = draftFor($this->admin, [
        'category_id' => $category->id,
        'status' => Post::STATUS_PUBLISHED,
        'published_at' => now()->subDay(),
    ]);

    $this->get('/blog')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('blog/index')
            ->where('posts.data.0.title', $post->title)
            ->where('categories.0.name', 'Craft'));

    $this->get('/blog/'.$post->slug)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('blog/show')
            ->where('post.title', $post->title)
            ->where('post.blocks.0.type', 'paragraph'));

    $this->get('/blog/rss.xml')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/rss+xml; charset=UTF-8')
        ->assertSee($post->title);
});

it('keeps drafts and future-dated posts off the public site', function () {
    $draft = draftFor($this->admin);
    $scheduled = draftFor($this->admin, [
        'title' => 'Not yet',
        'slug' => 'not-yet',
        'status' => Post::STATUS_PUBLISHED,
        'published_at' => now()->addWeek(),
    ]);

    $this->get('/blog/'.$draft->slug)->assertNotFound();
    $this->get('/blog/'.$scheduled->slug)->assertNotFound();
    $this->get('/blog/rss.xml')->assertDontSee('Not yet');
});

it('creates, publishes, unpublishes and deletes a post over http', function () {
    $this->actingAs($this->admin)->get('/admin/posts')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('posts/index')->where('counts.all', 0));

    $this->actingAs($this->admin)
        ->post('/admin/posts', [
            'title' => 'Letterpress and patience',
            'excerpt' => 'Slow is a feature.',
            'body' => 'A press is a machine that rewards patience.',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $post = Post::query()->firstOrFail();

    expect($post->status)->toBe(Post::STATUS_DRAFT)
        ->and($post->slug)->toBe('letterpress-and-patience');

    $this->actingAs($this->admin)->post('/admin/posts/'.$post->id.'/publish')->assertRedirect();

    expect($post->fresh()->status)->toBe(Post::STATUS_PUBLISHED)
        ->and($post->fresh()->isLive())->toBeTrue();

    $this->actingAs($this->admin)->post('/admin/posts/'.$post->id.'/unpublish')->assertRedirect();

    expect($post->fresh()->status)->toBe(Post::STATUS_DRAFT);

    $this->actingAs($this->admin)->delete('/admin/posts/'.$post->id)->assertRedirect();
});

it('lets authors write but never publish', function () {
    $this->actingAs($this->author)->post('/admin/posts', [
        'title' => 'An author draft',
        'body' => 'Words from the author role.',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $post = Post::query()->firstOrFail();

    $this->actingAs($this->author)->post('/admin/posts/'.$post->id.'/publish')->assertForbidden();

    expect($post->fresh()->status)->toBe(Post::STATUS_DRAFT);
});

it('stores categories and tags from the taxonomy screen', function () {
    $this->actingAs($this->admin)->get('/admin/posts/taxonomy')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('posts/taxonomy')->has('categories', 0));

    $this->actingAs($this->admin)->post('/admin/categories', ['name' => 'Studio'])->assertSessionHasNoErrors();
    $this->actingAs($this->admin)->post('/admin/tags', ['name' => 'Process'])->assertSessionHasNoErrors();

    $category = Category::query()->firstOrFail();
    $tag = Tag::query()->firstOrFail();

    expect($category->slug)->toBe('studio')
        ->and($tag->slug)->toBe('process');

    $this->actingAs($this->admin)->patch('/admin/categories/'.$category->id, ['name' => 'The studio'])->assertSessionHasNoErrors();

    expect($category->fresh()->name)->toBe('The studio');
});

it('disappears from navigation and routing when deactivated, keeping every row', function () {
    draftFor($this->admin);

    app(AddonManager::class)->deactivate('PostCraft');

    bootNextRequest();

    expect(app(AddonRepository::class)->find('PostCraft')->status)->toBe('inactive')
        ->and(Post::query()->count())->toBe(1)
        ->and(collect(app(Navigation::class)->raw())->pluck('route'))->not->toContain('/admin/posts');

    $this->get('/blog')->assertNotFound();
    $this->actingAs($this->admin)->get('/admin/posts')->assertNotFound();
});

it('restores routes, navigation and content when activated again', function () {
    draftFor($this->admin);

    app(AddonManager::class)->deactivate('PostCraft');
    app(AddonManager::class)->activate('PostCraft');

    bootNextRequest();

    expect(app(AddonRepository::class)->find('PostCraft')->status)->toBe('active')
        ->and(Post::query()->count())->toBe(1)
        ->and(collect(app(Navigation::class)->raw())->pluck('route'))->toContain('/admin/posts');

    $this->get('/blog')->assertOk();
    $this->actingAs($this->admin)->get('/admin/posts')->assertOk();
});

it('adds a blog teaser section that resolves to live posts', function () {
    $section = app(SectionRegistry::class)->find('blog-teaser');

    expect($section)->not->toBeNull()
        ->and($section->hasData())->toBeTrue();

    draftFor($this->admin, [
        'status' => Post::STATUS_PUBLISHED,
        'published_at' => now()->subHour(),
    ]);

    $data = $section->resolveData();

    expect($data['posts'])->toHaveCount(1)
        ->and($data['posts'][0]['url'])->toBe('/blog/a-post-about-paper')
        ->and($data['blog_url'])->toBe('/blog');
});
