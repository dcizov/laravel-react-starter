<?php

declare(strict_types=1);

use App\Cms\Notifications\Inbox;
use App\Cms\Repositories\AddonRepository;
use App\Models\Media;
use App\Models\Page;
use App\Models\PageView;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->assignRole('Admin');

    $this->author = User::factory()->create();
    $this->author->assignRole('Author');
});

function notify(User $user, string $title, array $extra = []): void
{
    $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\\Notifications\\SystemNotice',
        'data' => ['title' => $title, 'body' => 'Body text', 'level' => 'info'] + $extra,
        'read_at' => null,
    ]);
}

it('renders the four KPIs, the traffic series and the two lists', function () {
    Page::factory()->published()->create(['title' => 'Home', 'slug' => 'home']);
    Page::factory()->create([
        'title' => 'Draft page',
        'slug' => 'draft-page',
        'status' => Page::STATUS_DRAFT,
        'author_id' => $this->admin->id,
    ]);
    Media::query()->create([
        'uuid' => (string) Str::uuid(),
        'disk' => 'public',
        'path' => 'media/one.jpg',
        'filename' => 'one.jpg',
        'original_name' => 'one.jpg',
        'mime' => 'image/jpeg',
        'type' => 'image',
        'size' => 1024,
    ]);

    PageView::query()->create(['path' => '/', 'created_at' => now()->subDays(2)]);
    PageView::query()->create(['path' => '/', 'created_at' => now()->subDay()]);

    activity('pages')->event('published')->log('Published “Home”');

    $this->actingAs($this->admin)
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('kpis', 4)
            ->where('kpis.0.key', 'pages')
            ->where('kpis.0.value', 1)
            ->where('kpis.0.hint', '1 in draft')
            ->where('kpis.1.value', 2)
            ->where('kpis.2.value', 1)
            ->where('kpis.3.value', 2)
            ->has('traffic.series', 14)
            ->where('traffic.total', 2)
            ->has('drafts', 1)
            ->where('drafts.0.title', 'Draft page')
            ->where('drafts.0.author', $this->admin->name)
            ->has('recent', 1)
            ->where('recent.0.description', 'Published “Home”')
            ->where('can.users', true));
});

it('stays inside its query budget', function () {
    Page::factory()->count(3)->published()->create();
    Page::factory()->count(2)->create(['status' => Page::STATUS_DRAFT]);

    foreach (range(1, 20) as $day) {
        PageView::query()->create(['path' => '/', 'created_at' => now()->subDays($day)]);
    }

    activity('pages')->event('updated')->log('Touched a page');

    $queries = 0;

    DB::listen(function () use (&$queries): void {
        $queries++;
    });

    $this->actingAs($this->admin)->get('/admin')->assertOk();

    // Aggregates plus one traffic query and two joined lists — no N+1.
    expect($queries)->toBeLessThanOrEqual(12);
});

it('gives authors the dashboard without the team shortcut', function () {
    $this->actingAs($this->author)
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('can.users', false)
            ->where('can.pages', true)
            ->where('can.addons', false));
});

it('reports addon health, including a failed addon', function () {
    $repository = app(AddonRepository::class);

    foreach ($repository->discovered() as $manifest) {
        if ($manifest->handle !== 'Shopper') {
            $repository->install($manifest);
        }
    }

    $repository->setStatus('Demo', 'error', 'Provider blew up');

    $this->actingAs($this->admin)
        ->get('/admin')
        ->assertInertia(fn ($page) => $page
            ->where('addons.errors', 1)
            ->where('addons.healthy', 0)
            ->where('addons.rows.0.status', 'error')
            ->where('addons.rows.0.error', 'Provider blew up'));
});

it('shows an empty state rather than failing on a brand new install', function () {
    $this->actingAs($this->admin)
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('drafts', 0)
            ->has('recent', 0)
            ->has('addons.rows', 0)
            ->where('traffic.total', 0)
            ->where('traffic.change', null));
});

it('does not ship the bell rows with the first paint', function () {
    notify($this->admin, 'An addon failed to boot');

    // Deferred: the client asks for the rows separately, so the bell paints a
    // skeleton first and the dashboard never waits on notifications.
    $this->actingAs($this->admin)
        ->get('/admin')
        ->assertInertia(fn ($page) => $page->component('dashboard')->missing('notifications'));

    $inbox = app(Inbox::class)->for($this->admin);

    expect($inbox['unread'])->toBe(1)
        ->and($inbox['items'])->toHaveCount(1)
        ->and($inbox['items'][0]['title'])->toBe('An addon failed to boot')
        ->and($inbox['items'][0]['read'])->toBeFalse();
});

it('marks one notification read and counts the unread ones', function () {
    notify($this->admin, 'An addon failed to boot');
    notify($this->admin, 'A page was published');

    $row = $this->admin->notifications()->first();

    $this->actingAs($this->admin)
        ->post(route('admin.notifications.read', ['notification' => $row->id]))
        ->assertRedirect();

    expect($row->fresh()->read_at)->not->toBeNull()
        ->and($this->admin->unreadNotifications()->count())->toBe(1);
});

it('never lets one user touch another user\'s notifications', function () {
    notify($this->author, 'Private note');

    $row = $this->author->notifications()->first();

    $this->actingAs($this->admin)
        ->post(route('admin.notifications.read', ['notification' => $row->id]))
        ->assertRedirect();

    expect($row->fresh()->read_at)->toBeNull();
});

it('marks everything read at once', function () {
    notify($this->admin, 'One');
    notify($this->admin, 'Two');

    $this->actingAs($this->admin)
        ->post(route('admin.notifications.read-all'))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($this->admin->unreadNotifications()->count())->toBe(0);
});
