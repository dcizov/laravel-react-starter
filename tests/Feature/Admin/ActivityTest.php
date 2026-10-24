<?php

declare(strict_types=1);

use App\Models\User;
use Carbon\CarbonInterface;
use Database\Seeders\RolePermissionSeeder;
use Spatie\Activitylog\Models\Activity;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->admin = User::factory()->create(['name' => 'Ada Admin']);
    $this->admin->assignRole('Admin');

    $this->editor = User::factory()->create(['name' => 'Eve Editor']);
    $this->editor->assignRole('Editor');

    $this->author = User::factory()->create();
    $this->author->assignRole('Author');
});

function record(string $log, string $event, string $description, ?User $causer = null, ?CarbonInterface $at = null): Activity
{
    $logger = activity($log)->event($event);

    if ($causer !== null) {
        $logger->causedBy($causer);
    }

    $logger->log($description);

    $row = Activity::query()->latest('id')->firstOrFail();

    if ($at !== null) {
        $row->forceFill(['created_at' => $at])->save();
    }

    return $row;
}

it('groups the timeline by day with today and yesterday labelled', function () {
    record('pages', 'published', 'Published “Home”', $this->admin, now());
    record('pages', 'updated', 'Updated “Services”', $this->editor, now()->subDay());

    $this->actingAs($this->admin)
        ->get('/admin/activity')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/activity/index')
            ->has('groups', 2)
            ->where('groups.0.label', 'Today')
            ->where('groups.1.label', 'Yesterday')
            ->where('groups.0.items.0.causer', 'Ada Admin')
            ->where('pagination.total', 2)
            ->where('active', false)
            ->has('options.logs', 1)
            ->has('options.causers', 3));
});

it('filters by log, event, person, search text and date range', function () {
    record('pages', 'published', 'Published “Home”', $this->admin, now()->subDays(10));
    record('media', 'uploaded', 'Uploaded a hero image', $this->editor, now()->subDays(5));
    record('settings', 'updated', 'Updated mail settings', $this->admin, now());

    $this->actingAs($this->admin)
        ->get('/admin/activity?log=media')
        ->assertInertia(fn ($page) => $page->where('pagination.total', 1)->where('groups.0.items.0.description', 'Uploaded a hero image'));

    $this->actingAs($this->admin)
        ->get('/admin/activity?event=published')
        ->assertInertia(fn ($page) => $page->where('pagination.total', 1));

    $this->actingAs($this->admin)
        ->get('/admin/activity?causer='.$this->admin->id)
        ->assertInertia(fn ($page) => $page->where('pagination.total', 2)->where('active', true));

    $this->actingAs($this->admin)
        ->get('/admin/activity?q=hero')
        ->assertInertia(fn ($page) => $page->where('pagination.total', 1));

    $this->actingAs($this->admin)
        ->get('/admin/activity?from='.now()->subDays(7)->toDateString())
        ->assertInertia(fn ($page) => $page->where('pagination.total', 2));

    $this->actingAs($this->admin)
        ->get('/admin/activity?to='.now()->subDays(7)->toDateString())
        ->assertInertia(fn ($page) => $page->where('pagination.total', 1));
});

it('ignores a malformed date instead of failing', function () {
    record('pages', 'published', 'Published “Home”', $this->admin, now());

    $this->actingAs($this->admin)
        ->get('/admin/activity?from=not-a-date&to=also-not-a-date')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.from', null)
            ->where('pagination.total', 1));
});

it('distinguishes an empty log from an empty filter result', function () {
    $this->actingAs($this->admin)
        ->get('/admin/activity')
        ->assertInertia(fn ($page) => $page->has('groups', 0)->where('active', false));

    record('pages', 'published', 'Published “Home”', $this->admin, now());

    $this->actingAs($this->admin)
        ->get('/admin/activity?q=nothing-matches-this')
        ->assertInertia(fn ($page) => $page
            ->has('groups', 0)
            ->where('active', true)
            ->where('pagination.total', 0));
});

it('paginates thirty rows at a time', function () {
    foreach (range(1, 35) as $index) {
        record('pages', 'updated', 'Touched page '.$index, $this->admin, now()->subMinutes($index));
    }

    $this->actingAs($this->admin)
        ->get('/admin/activity')
        ->assertInertia(fn ($page) => $page
            ->where('pagination.total', 35)
            ->where('pagination.from', 1)
            ->where('pagination.to', 30)
            ->has('pagination.links', 4));

    $this->actingAs($this->admin)
        ->get('/admin/activity?page=2')
        ->assertInertia(fn ($page) => $page->where('pagination.from', 31)->where('pagination.to', 35));
});

it('lets authors read the trail', function () {
    record('pages', 'published', 'Published “Home”', $this->admin, now());

    $this->actingAs($this->author)->get('/admin/activity')->assertOk();
});

it('keeps the trail behind the login', function () {
    $this->get('/admin/activity')->assertRedirect('/login');
});
