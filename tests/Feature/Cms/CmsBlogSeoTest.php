<?php

use App\Features\Blog\Models\Comment;
use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\Cta;
use App\Features\Cms\Support\ContentBlocks;
use App\Models\User;
use App\Settings\AppSettings;
use App\Support\Rbac;
use Illuminate\Validation\ValidationException;

// The cms, blog and seo routes are registered from FEATURES, which phpunit.xml switches on for the test run.

beforeEach(function () {
    Rbac::sync();
    config(['features.enabled' => ['landing', 'newsletter', 'integrations', 'cms', 'blog', 'seo']]);
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

    $this->post('/blog/with-comments/comments', ['author_name' => 'Ada', 'body' => 'Nice', 'website' => 'spam.example'])
        ->assertRedirect();
    expect(Comment::query()->count())->toBe(0);

    $this->post('/blog/with-comments/comments', ['author_name' => 'Ada', 'body' => 'Nice'])
        ->assertRedirect();
    expect(Comment::query()->where('status', Comment::PENDING)->count())->toBe(1);
});

test('comments are not accepted on custom types', function () {
    publishedEntry('page', 'no-comments');

    $this->post('/pages/no-comments/comments', ['author_name' => 'Ada', 'body' => 'Nope'])->assertNotFound();
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

test('a block with an unsafe link is rejected on the body', function () {
    try {
        ContentBlocks::validate([['id' => 'i1', 'type' => 'image', 'data' => ['src' => 'javascript:alert(1)']]]);
        $this->fail('The unsafe image link should have been rejected.');
    } catch (ValidationException $exception) {
        expect($exception->errors())->toHaveKey('body');
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
