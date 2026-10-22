<?php

use App\Features\Cms\Models\ContentEntry;
use App\Models\Task;
use App\Models\User;
use App\Support\Rbac;

beforeEach(function () {
    // The page is rendered without a built Vite manifest, so the test does not depend on `npm run build`.
    $this->withoutVite();

    Rbac::sync();
});

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('the dashboard counts only the signed-in user\'s tasks', function () {
    $user = User::factory()->create();
    Task::factory()->create(['user_id' => $user->id, 'status' => 'todo', 'priority' => 'high']);
    Task::factory()->create(['user_id' => $user->id, 'status' => 'in progress', 'priority' => 'low']);
    Task::factory()->create(['user_id' => $user->id, 'status' => 'done', 'priority' => 'high']);
    Task::factory()->create(['user_id' => $user->id, 'status' => 'canceled', 'priority' => 'high']);

    // Someone else's tasks must not change the numbers.
    Task::factory()->count(3)->create(['status' => 'todo', 'priority' => 'high']);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('summary.total', 4)
            ->where('summary.open', 2)
            ->where('summary.in_progress', 1)
            ->where('summary.done', 1)
            ->where('summary.high_priority', 1)
            ->where('showOwner', false)
            ->where('usersCount', null)
            ->has('attention', 1)
            ->has('recent', 4));
});

test('users with tasks.view-any see every task and the user count', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    Task::factory()->count(2)->create(['status' => 'todo', 'priority' => 'high']);
    Task::factory()->create(['status' => 'done', 'priority' => 'low']);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('summary.total', 3)
            ->where('summary.open', 2)
            ->where('summary.high_priority', 2)
            ->where('showOwner', true)
            ->where('usersCount', User::count())
            ->has('attention', 2)
            ->has('attention.0.owner'));
});

test('the attention list only holds open high-priority tasks', function () {
    $user = User::factory()->create();
    Task::factory()->create(['user_id' => $user->id, 'status' => 'done', 'priority' => 'high', 'title' => 'Finished']);
    Task::factory()->create(['user_id' => $user->id, 'status' => 'todo', 'priority' => 'low', 'title' => 'Low']);
    Task::factory()->create(['user_id' => $user->id, 'status' => 'todo', 'priority' => 'high', 'title' => 'Urgent']);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->has('attention', 1)
            ->where('attention.0.title', 'Urgent'));
});

test('a new account sees an empty dashboard', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('summary.total', 0)
            ->has('attention', 0)
            ->has('recent', 0));
});

test('the dashboard reports completion and the change against last week', function () {
    $user = User::factory()->create();

    // Two tasks created this week, one done.
    Task::factory()->create(['user_id' => $user->id, 'status' => 'done']);
    Task::factory()->create(['user_id' => $user->id, 'status' => 'todo']);

    // Two tasks created 10 days ago, so last week had two and this week has two.
    // created_at is not fillable on Task, so it is set with forceFill.
    Task::factory()->count(2)->create(['user_id' => $user->id, 'status' => 'todo'])
        ->each(fn (Task $task) => $task->forceFill(['created_at' => now()->subDays(10)])->save());

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('summary.completion', 25)
            ->where('summary.created_this_week', 2)
            ->where('summary.created_change', 0));
});

test('a new account has no change to report against last week', function () {
    $user = User::factory()->create();
    Task::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('summary.created_change', null));
});

// The site overview cards. They are deferred: the first response only names the prop, and the cards load in a
// second request, so these tests load the deferred prop the way the page does.

function enableOverviewFeatures(): void
{
    config(['features.enabled' => ['landing', 'integrations', 'cms', 'blog', 'seo']]);
    activateNewsletterAddon();
}

function overviewEntry(array $attributes): ContentEntry
{
    return ContentEntry::query()->create(array_merge([
        'content_type' => 'page',
        'title' => 'Entry',
        'slug' => 'entry-'.uniqid(),
        'status' => ContentEntry::STATUS_PUBLISHED,
        'published_at' => now()->subDay(),
        'body' => [],
        'custom_fields' => [],
        'seo' => [],
    ], $attributes));
}

test('the site overview is deferred, so the first response does not carry it', function () {
    enableOverviewFeatures();
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $response = $this->actingAs($admin)->get(route('dashboard'));

    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->missing('overview'));

    // AssertableInertia does not expose the deferred groups, so read them from the page the response renders.
    // The overview is listed there, which is what makes the frontend request it.
    $deferred = collect($response->viewData('page')['deferredProps'] ?? [])->flatten()->all();

    expect($deferred)->not->toBeEmpty()
        ->and(collect($deferred)->contains(fn (string $path): bool => str_starts_with($path, 'overview')))->toBeTrue();
});

test('the overview counts published, draft and trashed entries for users who may edit any', function () {
    enableOverviewFeatures();
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $author = User::factory()->create();

    overviewEntry(['author_id' => $author->id, 'slug' => 'author-live']);
    overviewEntry(['author_id' => $admin->id, 'slug' => 'admin-live']);
    overviewEntry(['author_id' => $author->id, 'slug' => 'author-draft', 'status' => ContentEntry::STATUS_DRAFT]);
    overviewEntry(['author_id' => $author->id, 'slug' => 'author-trashed'])->delete();

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->loadDeferredProps(fn ($reload) => $reload
                ->where('overview.content.published', 2)
                ->where('overview.content.drafts', 1)
                ->where('overview.content.trashed', 1)
                ->where('overview.content.canCreate', true)
                ->where('overview.site.isDefault', true)
                ->has('overview.content.types')));
});

test('authors see the counts of their own entries only', function () {
    enableOverviewFeatures();
    $author = User::factory()->create();
    $author->assignRole('author');
    $other = User::factory()->create();

    overviewEntry(['author_id' => $author->id, 'slug' => 'mine']);
    overviewEntry(['author_id' => $other->id, 'slug' => 'theirs']);

    $this->actingAs($author)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->loadDeferredProps(fn ($reload) => $reload
                ->where('overview.content.published', 1)
                ->where('overview.content.drafts', 0)));
});

test('a user without any permission gets the site name and no cards', function () {
    enableOverviewFeatures();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->loadDeferredProps(fn ($reload) => $reload
                ->has('overview.site')
                ->missing('overview.content')
                ->missing('overview.comments')
                ->missing('overview.newsletter')
                ->missing('overview.seo')
                ->missing('overview.sites')));
});

test('the comments, newsletter, seo and sites cards need their permission', function () {
    enableOverviewFeatures();
    $user = User::factory()->create();
    $user->givePermissionTo(['comments.moderate', 'sites.manage']);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->loadDeferredProps(fn ($reload) => $reload
                ->has('overview.comments.pending')
                ->has('overview.sites.count')
                ->missing('overview.newsletter')
                ->missing('overview.seo')));
});

test('a card is left out while its feature is switched off', function () {
    config(['features.enabled' => ['landing', 'integrations']]);
    activateNewsletterAddon();
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->loadDeferredProps(fn ($reload) => $reload
                ->missing('overview.content')
                ->missing('overview.comments')
                ->missing('overview.seo')
                ->has('overview.newsletter')
                ->has('overview.sites')));
});
