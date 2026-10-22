<?php

use App\Features\Blog\Seeders\BlogDemoSeeder;
use App\Features\Cms\Models\Comment;
use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Features\Cms\Seeders\CmsDemoSeeder;
use App\Features\Seo\Seeders\SeoDemoSeeder;
use App\Settings\AppSettings;

// The demo seeders add example content for the cms, blog, and seo features. They must be safe to run twice.

test('the demo seeders add content for every new feature', function () {
    $this->seed([CmsDemoSeeder::class, BlogDemoSeeder::class, SeoDemoSeeder::class]);

    expect(ContentType::query()->where('key', 'events')->exists())->toBeTrue()
        ->and(ContentEntry::query()->where('content_type', 'events')->count())->toBe(4)
        ->and(ContentEntry::query()->where('content_type', 'page')->count())->toBeGreaterThanOrEqual(4)
        ->and(ContentEntry::query()->where('content_type', 'post')->count())->toBe(14)
        ->and(Comment::query()->count())->toBeGreaterThan(0)
        ->and(app(AppSettings::class)->seo_description)->not->toBeEmpty();
});

test('the demo seeders can run again without duplicating content', function () {
    $this->seed([CmsDemoSeeder::class, BlogDemoSeeder::class, SeoDemoSeeder::class]);

    $entries = ContentEntry::query()->count();
    $comments = Comment::query()->count();

    $this->seed([CmsDemoSeeder::class, BlogDemoSeeder::class, SeoDemoSeeder::class]);

    expect(ContentEntry::query()->count())->toBe($entries)
        ->and(Comment::query()->count())->toBe($comments);
});

test('the factories make published, draft, and pending content for the tests and tinker', function () {
    ContentEntry::factory()->post()->count(3)->create();
    ContentEntry::factory()->page()->draft()->create();

    expect(ContentEntry::query()->where('content_type', 'post')->where('status', ContentEntry::STATUS_PUBLISHED)->count())->toBe(3)
        ->and(ContentEntry::query()->where('status', ContentEntry::STATUS_DRAFT)->count())->toBe(1);

    $entry = ContentEntry::query()->firstOrFail();
    Comment::factory()->for($entry, 'entry')->create();

    expect(Comment::query()->where('status', Comment::PENDING)->count())->toBe(1);
});
