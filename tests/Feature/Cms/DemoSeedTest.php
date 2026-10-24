<?php

use App\Addons\PostCraft\Models\Category;
use App\Addons\PostCraft\Models\Post;
use App\Cms\Settings\SettingRepository;
use App\Models\Media;
use App\Models\MenuItem;
use App\Models\Page;
use App\Models\PageView;
use Database\Seeders\DemoSeeder;
use Illuminate\Support\Facades\Storage;
use Spatie\Activitylog\Models\Activity;

beforeEach(function () {
    Storage::fake('public');
});

it('seeds the demo site described by the spec', function () {
    $this->seed(DemoSeeder::class);

    $pages = Page::query()->withTrashed()->get();

    expect($pages)->toHaveCount(8)
        ->and($pages->where('status', Page::STATUS_PUBLISHED)->whereNull('deleted_at'))->toHaveCount(5)
        ->and($pages->where('status', Page::STATUS_SCHEDULED))->toHaveCount(1)
        ->and($pages->where('status', Page::STATUS_DRAFT))->toHaveCount(1)
        ->and(Page::onlyTrashed()->count())->toBe(1)
        ->and(Media::query()->count())->toBe(8)
        ->and(Activity::query()->count())->toBe(25)
        ->and(Post::query()->count())->toBe(6)
        ->and(Category::query()->count())->toBe(3)
        ->and(PageView::query()->count())->toBeGreaterThan(500);

    $home = Page::query()->where('slug', 'home')->firstOrFail();

    expect($home->content)->toHaveCount(4)
        ->and($home->content[0]['section'])->toBe('hero')
        ->and($home->excerpt)->not->toBeEmpty()
        ->and($home->revisions()->count())->toBeGreaterThan(0);

    $menu = MenuItem::query()->where('menu', 'main')->where('label', 'Services')->firstOrFail();

    expect($menu->page_id)->toBe(Page::query()->where('slug', 'services')->value('id'));
});

it('leaves the settings and the public site usable', function () {
    $this->seed(DemoSeeder::class);

    $public = app(SettingRepository::class)->publicValues();

    expect($public['name'])->toBe('Northwind Studio')
        ->and($public['logo'])->toStartWith('/storage/')
        ->and($public['posts_per_page'])->toBe(6);

    app(SettingRepository::class)->applyToConfig();

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('site.name', 'Northwind Studio')
            ->where('settings.public.name', 'Northwind Studio')
            ->where('page.slug', 'home'));
});

it('is idempotent', function () {
    $this->seed(DemoSeeder::class);
    $this->seed(DemoSeeder::class);

    expect(Page::query()->withTrashed()->count())->toBe(8)
        ->and(Media::query()->count())->toBe(8)
        ->and(Post::query()->count())->toBe(6)
        ->and(Category::query()->count())->toBe(3)
        ->and(Page::query()->withTrashed()->where('slug', 'home')->firstOrFail()->content)->toHaveCount(4);
});
