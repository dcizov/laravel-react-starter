<?php

declare(strict_types=1);

use App\Cms\Repositories\ThemeRepository;
use App\Cms\Themes\ThemeManager;
use App\Models\Page;
use Illuminate\Support\Facades\Artisan;

beforeEach(function () {
    foreach (app(ThemeRepository::class)->discovered() as $manifest) {
        app(ThemeRepository::class)->install($manifest);
    }
});

it('activates a theme from the command line', function () {
    $this->artisan('theme:activate', ['handle' => 'meridian'])->assertSuccessful();

    expect(app(ThemeManager::class)->activeHandle())->toBe('meridian');
});

it('refuses a theme that is not on disk', function () {
    $this->artisan('theme:activate', ['handle' => 'nope'])->assertFailed();
});

it('publishes pages whose slot has passed and leaves the rest alone', function () {
    $due = Page::factory()->create([
        'slug' => 'due',
        'status' => Page::STATUS_SCHEDULED,
        'scheduled_at' => now()->subMinute(),
        'published_at' => null,
    ]);

    $later = Page::factory()->create([
        'slug' => 'later',
        'status' => Page::STATUS_SCHEDULED,
        'scheduled_at' => now()->addDay(),
        'published_at' => null,
    ]);

    $this->artisan('pages:publish-scheduled')->assertSuccessful();

    expect($due->fresh()->status)->toBe(Page::STATUS_PUBLISHED)
        ->and($due->fresh()->published_at)->not->toBeNull()
        ->and($later->fresh()->status)->toBe(Page::STATUS_SCHEDULED);
});

it('does nothing when no page is due', function () {
    $this->artisan('pages:publish-scheduled')
        ->expectsOutputToContain('Nothing is due.')
        ->assertSuccessful();
});

it('schedules the publisher every minute', function () {
    $schedule = Artisan::call('schedule:list');

    expect($schedule)->toBe(0);
});
