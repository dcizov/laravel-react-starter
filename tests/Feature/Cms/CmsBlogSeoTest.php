<?php

use App\Features\Cms\Models\Comment;
use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Features\Cms\Models\Cta;
use App\Features\Cms\Models\Term;
use App\Features\Cms\Support\ContentBlocks;
use App\Models\User;
use App\Settings\AppSettings;
use App\Support\Rbac;
use Illuminate\Validation\ValidationException;

// The cms, blog and seo routes are registered from FEATURES, which phpunit.xml switches on for the test run.

beforeEach(function () {
    Rbac::sync();
    config(['features.enabled' => ['landing', 'integrations', 'cms', 'blog', 'seo']]);

    // The built Vite manifest may predate some pages; these tests check the server, not the bundle.
    $this->withoutVite();
});

function publishedEntry(string $type, string $slug, array $attributes = []): ContentEntry
{
    return ContentEntry::query()->create(array_merge([
        'content_type' => $type,
        'title' => ucfirst($slug),
        'slug' => $slug,
        'status' => ContentEntry::STATUS_PUBLISHED,
        'published_at' => now()->subDay(),
        'body' => [],
        'custom_fields' => [],
        'seo' => [],
    ], $attributes));
}

test('a published page is shown and a draft is not', function () {
    publishedEntry('page', 'about');
    ContentEntry::query()->create([
        'content_type' => 'page', 'title' => 'Draft', 'slug' => 'draft', 'status' => ContentEntry::STATUS_DRAFT,
        'body' => [], 'custom_fields' => [], 'seo' => [],
    ]);

    $this->get('/pages/about')->assertOk();
    $this->get('/pages/draft')->assertNotFound();
});

test('a scheduled entry stays hidden until its date', function () {
    publishedEntry('page', 'later', ['published_at' => now()->addDay()]);

    $this->get('/pages/later')->assertNotFound();
});

test('a post redirects to the blog and the blog lists approved comments only', function () {
    $post = publishedEntry('post', 'hello-world');

    $this->get('/content/post/hello-world')->assertRedirect('/blog/hello-world');

    Comment::query()->create(['entry_id' => $post->id, 'author_name' => 'Ada', 'body' => 'Approved one', 'status' => Comment::APPROVED]);
    Comment::query()->create(['entry_id' => $post->id, 'author_name' => 'Bob', 'body' => 'Still waiting', 'status' => Comment::PENDING]);

    $this->get('/blog/hello-world')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('blog/show')->has('comments', 1));
});

test('a visitor comment waits for approval, and a bot that fills the hidden field is ignored', function () {
    publishedEntry('post', 'with-comments');

    $this->post('/content/post/with-comments/comments', ['author_name' => 'Ada', 'body' => 'Nice', 'website' => 'spam.example'])
        ->assertRedirect();
    expect(Comment::query()->count())->toBe(0);

    $this->post('/content/post/with-comments/comments', ['author_name' => 'Ada', 'body' => 'Nice'])
        ->assertRedirect();
    expect(Comment::query()->where('status', Comment::PENDING)->count())->toBe(1);
});

test('comments are not accepted on types without the comments support', function () {
    publishedEntry('page', 'no-comments');

    $this->post('/content/page/no-comments/comments', ['author_name' => 'Ada', 'body' => 'Nope'])->assertNotFound();
    expect(Comment::query()->count())->toBe(0);
});

test('a custom type with the comments support takes comments and shows approved ones', function () {
    $type = ContentType::query()->create([
        'key' => 'events', 'label' => 'Events', 'singular_label' => 'Event', 'has_archive' => true,
        'supports' => ['comments'], 'fields' => [],
    ]);
    $event = publishedEntry($type->key, 'launch-day');

    $this->post('/content/events/launch-day/comments', ['author_name' => 'Ada', 'body' => 'See you there'])->assertRedirect();
    Comment::query()->create(['entry_id' => $event->id, 'author_name' => 'Bob', 'body' => 'Visible', 'status' => Comment::APPROVED]);

    $this->get('/content/events/launch-day')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('content/entry')
            ->where('commentsEnabled', true)
            ->has('comments', 1));
    expect(Comment::query()->where('status', Comment::PENDING)->count())->toBe(1);
});

test('an admin saves a block body and it persists', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user)->post('/admin/content/page', [
        'title' => 'With body',
        'slug' => 'with-body',
        'status' => ContentEntry::STATUS_PUBLISHED,
        'term_ids' => [],
        'body' => [
            ['id' => 'p1', 'type' => 'paragraph', 'data' => ['text' => 'Saved paragraph']],
        ],
    ])->assertRedirect();

    expect(ContentEntry::query()->where('slug', 'with-body')->firstOrFail()->body)
        ->toBe([['id' => 'p1', 'type' => 'paragraph', 'data' => ['text' => 'Saved paragraph']]]);
});

test('a bad block reports its error under that block only', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user)->post('/admin/content/page', [
        'title' => 'Bad body',
        'slug' => 'bad-body',
        'status' => ContentEntry::STATUS_DRAFT,
        'term_ids' => [],
        'body' => [
            ['id' => 'p1', 'type' => 'paragraph', 'data' => ['text' => 'Fine']],
            ['id' => 'i1', 'type' => 'image', 'data' => ['src' => 'javascript:alert(1)']],
        ],
    ])->assertSessionHasErrors(['body.1.src']);
});

test('the latest posts block fills in the newest posts, and is hidden while the blog is off', function () {
    publishedEntry('post', 'older', ['published_at' => now()->subDays(3)]);
    publishedEntry('post', 'newer', ['published_at' => now()->subDay()]);

    $settings = app(AppSettings::class);
    $settings->landing_published = [[
        'id' => 'posts-1', 'type' => 'posts', 'data' => ['title' => 'News', 'count' => 1],
    ]];
    $settings->save();

    $this->get('/')->assertInertia(fn ($page) => $page
        ->where('blocks.0.type', 'posts')
        ->has('blocks.0.data.posts', 1)
        ->where('blocks.0.data.posts.0.slug', 'newer'));

    config(['features.enabled' => ['landing', 'integrations', 'cms', 'seo']]);

    $this->get('/')->assertInertia(fn ($page) => $page->has('blocks', 0));
});

test('categories are scoped to their content type', function () {
    $category = Term::query()->create(['content_type' => 'post', 'taxonomy' => Term::CATEGORY, 'name' => 'News', 'slug' => 'news']);
    Term::query()->create(['content_type' => 'page', 'taxonomy' => Term::CATEGORY, 'name' => 'News', 'slug' => 'news']);

    expect(Term::query()->forType('post')->pluck('id')->all())->toBe([$category->id]);
});

test('the archive filters by a category of its own type only', function () {
    $category = Term::query()->create(['content_type' => 'post', 'taxonomy' => Term::CATEGORY, 'name' => 'Tips', 'slug' => 'tips']);
    $tagged = publishedEntry('post', 'tagged-post');
    publishedEntry('post', 'untagged-post');
    $tagged->terms()->attach($category->id);

    $this->get('/blog?category=tips')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('blog/index')
            ->has('posts.data', 1)
            ->where('posts.data.0.slug', 'tagged-post'));

    // A term of another type is not found, so the filter is ignored rather than leaking across types.
    Term::query()->create(['content_type' => 'page', 'taxonomy' => Term::TAG, 'name' => 'Pages only', 'slug' => 'pages-only']);

    $this->get('/blog?tag=pages-only')
        ->assertInertia(fn ($page) => $page->where('filter', null));
});

test('a saved call to action fills a landing block at render time', function () {
    $cta = Cta::query()->create(['name' => 'Main', 'heading' => 'Saved heading', 'text' => 'Saved text', 'button_label' => 'Go', 'button_url' => '/register']);

    $settings = app(AppSettings::class);
    $settings->landing_published = [[
        'id' => 'cta-1', 'type' => 'cta', 'data' => ['title' => 'Old', 'cta_id' => $cta->id],
    ]];
    $settings->save();

    $this->get('/')->assertInertia(fn ($page) => $page
        ->where('blocks.0.data.title', 'Saved heading')
        ->where('blocks.0.data.button_url', '/register'));
});

test('a cta block that points at a missing call to action keeps its own text', function () {
    $settings = app(AppSettings::class);
    $settings->landing_published = [[
        'id' => 'cta-2', 'type' => 'cta', 'data' => ['title' => 'Own title', 'cta_id' => 9999],
    ]];
    $settings->save();

    $this->get('/')->assertInertia(fn ($page) => $page->where('blocks.0.data.title', 'Own title'));
});

test('content blocks reject unknown types and keep inline calls to action', function () {
    expect(fn () => ContentBlocks::validate([['id' => 'x', 'type' => 'script', 'data' => []]]))
        ->toThrow(ValidationException::class);

    $clean = ContentBlocks::validate([
        ['id' => 'c1', 'type' => 'cta', 'data' => ['heading' => 'Hi', 'text' => '', 'button_label' => '', 'button_url' => '']],
        ['id' => 'l1', 'type' => 'list', 'data' => ['ordered' => false, 'items' => ['One', '', ' Two ']]],
    ]);

    expect($clean[0]['data']['heading'])->toBe('Hi')
        ->and($clean[1]['data']['items'])->toBe(['One', 'Two']);
});

test('a block with an unsafe link is rejected under that block', function () {
    try {
        ContentBlocks::validate([['id' => 'i1', 'type' => 'image', 'data' => ['src' => 'javascript:alert(1)']]]);
        $this->fail('The unsafe image link should have been rejected.');
    } catch (ValidationException $exception) {
        expect($exception->errors())->toHaveKey('body.0.src');
    }
});

test('the admin content list needs the content permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/admin/content/page')->assertForbidden();
});

test('the sitemap lists live pages, skips noindex entries, and disappears when indexing is off', function () {
    publishedEntry('page', 'public-page');
    publishedEntry('page', 'hidden-page', ['seo' => ['noindex' => true]]);

    $this->get('/sitemap.xml')
        ->assertOk()
        ->assertSee('/pages/public-page', false)
        ->assertDontSee('hidden-page', false);

    $settings = app(AppSettings::class);
    $settings->seo_allow_indexing = false;
    $settings->save();

    $this->get('/sitemap.xml')->assertNotFound();
    $this->get('/robots.txt')->assertOk()->assertSee('Disallow: /', false);
});
