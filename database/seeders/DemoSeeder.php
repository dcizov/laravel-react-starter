<?php

namespace Database\Seeders;

use App\Addons\PostCraft\Models\Category;
use App\Addons\PostCraft\Models\Post;
use App\Addons\PostCraft\Models\Tag;
use App\Cms\Addons\AddonManager;
use App\Cms\Media\MediaLibrary;
use App\Cms\Repositories\AddonRepository;
use App\Cms\Repositories\ThemeRepository;
use App\Cms\Settings\SettingRepository;
use App\Cms\Themes\ThemeManager;
use App\Models\Media;
use App\Models\Page;
use App\Models\PageView;
use App\Models\User;
use Database\Seeders\Demo\PlaceholderImages;
use Illuminate\Database\Seeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Spatie\Activitylog\Models\Activity;

/**
 * The demo site: Northwind Studio, a design studio.
 *
 * Idempotent — running it twice leaves the same eight pages, eight images and
 * six posts behind, because every record is matched on its natural key. Dates
 * are relative to `now()`, so the dashboard chart and the activity timeline are
 * always "recent".
 */
class DemoSeeder extends Seeder
{
    private const IMAGES = [
        ['wordmark', 'Northwind Studio wordmark', 'The studio mark, set in Inter.'],
        ['identity', 'Identity system laid out on a table', 'Duotone cover for the identity case study.'],
        ['editorial', 'Editorial spread in a printed magazine', 'Sixty pages of print, one grid.'],
        ['product', 'Product interface on a desk', 'A checkout flow reduced to three screens.'],
        ['type', 'Type specimen poster', 'A specimen we drew for a museum.'],
        ['packaging', 'Packaging for a coffee roastery', 'Two inks, one uncoated stock.'],
        ['studio', 'The studio on a Tuesday afternoon', 'Six people, one long table.'],
        ['archive', 'Archive drawers of printed samples', 'Everything we have ever made, kept.'],
    ];

    public function run(): void
    {
        $this->call(DatabaseSeeder::class);

        $admin = $this->user('admin@lattice.test');
        $editor = $this->user('editor@lattice.test');
        $author = $this->user('author@lattice.test');

        $media = $this->media($admin);
        $pages = $this->pages($admin, $editor, $media);

        // The chrome links pages by id, so the menu is rebuilt once they exist.
        $this->call(MenuSeeder::class);

        $this->settings($media);
        $this->extensions();
        $this->posts($author, $media);
        $this->activity($admin, $editor, $pages);
        $this->traffic();
    }

    private function user(string $email): User
    {
        $user = User::query()->where('email', $email)->first();

        if ($user === null) {
            throw new \RuntimeException("The demo seeder expects {$email} to exist.");
        }

        return $user;
    }

    /**
     * @return array<string, Media>
     */
    private function media(User $admin): array
    {
        $library = app(MediaLibrary::class);
        $images = new PlaceholderImages;
        $media = [];

        foreach (self::IMAGES as [$key, $alt, $caption]) {
            $media[$key] = Media::query()->where('original_name', $key.'.jpg')->first()
                ?? $this->store($library, $images, $admin, $key, $alt, $caption);
        }

        return $media;
    }

    private function store(MediaLibrary $library, PlaceholderImages $images, User $admin, string $key, string $alt, string $caption): Media
    {
        $path = $images->make($key);

        $record = $library->store(
            new UploadedFile($path, $key.'.jpg', 'image/jpeg', null, true),
            null,
            $admin,
        );

        $record->update(['alt' => $alt, 'caption' => $caption]);

        @unlink($path);

        return $record;
    }

    /**
     * @param  array<string, Media>  $media
     * @return array<string, Page>
     */
    private function pages(User $admin, User $editor, array $media): array
    {
        $definitions = [
            [
                'slug' => 'home',
                'title' => 'Home',
                'status' => Page::STATUS_PUBLISHED,
                'author' => $admin,
                'excerpt' => 'An independent design studio in Hannover working on identity, product and print.',
                'seo_title' => 'Northwind Studio — identity, product and print',
                'seo_description' => 'We design brands, websites and printed matter for studios, museums and companies that intend to be around in ten years.',
                'featured' => 'identity',
                'sections' => [
                    ['hero', [
                        'eyebrow' => 'Design studio · Hannover',
                        'heading' => 'Identity that outlasts the launch',
                        'body' => 'We design brands, websites and printed matter for studios, museums and companies that intend to be around in ten years.',
                        'align' => 'center',
                        'cta_label' => 'See our services',
                        'cta_url' => '/services',
                        'image' => null,
                    ]],
                    ['feature-grid', [
                        'heading' => 'Three things, done properly',
                        'intro' => 'We take on a handful of projects a year. Each one gets the same people from first sketch to final print check.',
                        'features' => [
                            ['title' => 'Brand identity', 'body' => 'Naming, marks, type systems and the guidelines that keep them intact.', 'icon' => 'sparkles'],
                            ['title' => 'Digital products', 'body' => 'Sites and interfaces built on a design system, not on a deck.', 'icon' => 'layers'],
                            ['title' => 'Editorial and print', 'body' => 'Magazines, catalogues and packaging, with the press check included.', 'icon' => 'zap'],
                        ],
                    ]],
                    ['stat-band', [
                        'heading' => 'A studio by numbers',
                        'intro' => 'Founded in 2002, still independent, still six people.',
                        'stats' => [
                            ['value' => '24', 'label' => 'Years in practice'],
                            ['value' => '180+', 'label' => 'Projects shipped'],
                            ['value' => '6', 'label' => 'People, no exceptions'],
                            ['value' => '11', 'label' => 'Design awards'],
                        ],
                    ]],
                    ['cta', [
                        'heading' => 'Have something in mind?',
                        'body' => 'Tell us what you are making and we will tell you honestly whether we are the right studio for it.',
                        'button_label' => 'Start a conversation',
                        'button_url' => '/contact',
                        'accent' => 'oklch(0.51 0.19 264)',
                    ]],
                ],
            ],
            [
                'slug' => 'services',
                'title' => 'Services',
                'status' => Page::STATUS_PUBLISHED,
                'author' => $editor,
                'excerpt' => 'Identity, digital product, editorial and print — and the strategy that holds them together.',
                'seo_title' => 'Services — Northwind Studio',
                'seo_description' => 'What we do: brand strategy, visual identity, design systems, websites and printed matter.',
                'featured' => 'editorial',
                'sections' => [
                    ['hero', [
                        'eyebrow' => 'Services',
                        'heading' => 'Four disciplines, one team',
                        'body' => 'We do not hand projects between departments, because there are no departments.',
                        'align' => 'left',
                        'cta_label' => '',
                        'cta_url' => '',
                        'image' => null,
                    ]],
                    ['feature-grid', [
                        'heading' => 'How we can help',
                        'intro' => 'Most engagements start with a two-week audit and end with a system someone else can run.',
                        'features' => [
                            ['title' => 'Strategy', 'body' => 'Positioning, naming and the argument the brand makes in a crowded room.', 'icon' => 'sparkles'],
                            ['title' => 'Identity', 'body' => 'Marks, type, colour, motion — delivered as tokens, not as a PDF.', 'icon' => 'layers'],
                            ['title' => 'Digital', 'body' => 'Marketing sites, design systems and the editorial tooling behind them.', 'icon' => 'zap'],
                            ['title' => 'Print', 'body' => 'Books, catalogues, packaging and the paper that makes them worth keeping.', 'icon' => 'shield'],
                        ],
                    ]],
                    ['rich-text', [
                        'heading' => 'How we work',
                        'body' => "We work in three-week blocks with a review at the end of each one. You see the work as it is made, not after it is finished.\n\nEvery engagement includes the source files, the type licences and a written system your team can extend without us. If a project ends and nobody can change the site, we have failed.",
                        'width' => 'narrow',
                    ]],
                ],
            ],
            [
                'slug' => 'about',
                'title' => 'About',
                'status' => Page::STATUS_PUBLISHED,
                'author' => $admin,
                'excerpt' => 'Six people in a converted printworks, drawing before we click.',
                'seo_title' => 'About — Northwind Studio',
                'seo_description' => 'An independent studio founded in 2002, working from a converted printworks in Hannover.',
                'featured' => 'studio',
                'sections' => [
                    ['hero', [
                        'eyebrow' => 'About',
                        'heading' => 'We started with a photocopier and a deadline',
                        'body' => 'Twenty-four years later the photocopier is gone and the deadline is still there.',
                        'align' => 'left',
                        'cta_label' => '',
                        'cta_url' => '',
                        'image' => null,
                    ]],
                    ['rich-text', [
                        'heading' => 'The studio',
                        'body' => "Northwind is six people: two designers, a writer, a developer, a studio manager and whoever is making coffee. We take on eight to ten projects a year, which is as many as we can do without repeating ourselves.\n\nWe work from a converted printworks on the edge of the Linden district. The presses left in 1998; the paper stock stayed, and so did the habit of drawing everything first.",
                        'width' => 'narrow',
                    ]],
                    ['stat-band', [
                        'heading' => 'Where the time goes',
                        'intro' => 'A rough split across a typical year.',
                        'stats' => [
                            ['value' => '45%', 'label' => 'Identity and strategy'],
                            ['value' => '30%', 'label' => 'Digital products'],
                            ['value' => '20%', 'label' => 'Editorial and print'],
                            ['value' => '5%', 'label' => 'Teaching and talks'],
                        ],
                    ]],
                ],
            ],
            [
                'slug' => 'contact',
                'title' => 'Contact',
                'status' => Page::STATUS_PUBLISHED,
                'author' => $editor,
                'excerpt' => 'Write to us, or come by the studio on a Thursday.',
                'seo_title' => 'Contact — Northwind Studio',
                'seo_description' => 'The studio is in Hannover-Linden. Write to studio@northwind.test or come by on a Thursday afternoon.',
                'featured' => 'archive',
                'sections' => [
                    ['hero', [
                        'eyebrow' => 'Contact',
                        'heading' => 'Say hello',
                        'body' => 'New projects, print questions, or a second opinion on a type choice — all welcome.',
                        'align' => 'left',
                        'cta_label' => '',
                        'cta_url' => '',
                        'image' => null,
                    ]],
                    ['rich-text', [
                        'heading' => 'The details',
                        'body' => "Northwind Studio\nLimmerstraße 41\n30451 Hannover\n\nstudio@northwind.test\n+49 511 555 0142\n\nOpen Monday to Thursday, 9 to 17. The studio is on the second floor and there is no lift — write first and we will come down.",
                        'width' => 'narrow',
                    ]],
                    ['cta', [
                        'heading' => 'Prefer to talk?',
                        'body' => 'We keep Thursday afternoons free for first conversations, in person or on the phone.',
                        'button_label' => 'Write to the studio',
                        'button_url' => 'mailto:studio@northwind.test',
                        'accent' => 'oklch(0.51 0.19 264)',
                    ]],
                ],
            ],
            [
                'slug' => 'imprint',
                'title' => 'Imprint',
                'status' => Page::STATUS_PUBLISHED,
                'author' => $admin,
                'excerpt' => 'Who is responsible for this site.',
                'seo_title' => 'Imprint — Northwind Studio',
                'seo_description' => 'Imprint and responsible party for northwind.test.',
                'featured' => null,
                'sections' => [
                    ['rich-text', [
                        'heading' => 'Imprint',
                        'body' => "Northwind Studio GbR\nLimmerstraße 41, 30451 Hannover, Germany\n\nRepresented by Avery Quinn and Mira Lindqvist.\nVAT ID: DE 812 445 019.\n\nResponsible for content under § 18 (2) MStV: Avery Quinn, address as above.\n\nThe studio is not liable for the content of external links. At the time of linking, no unlawful content was identifiable.",
                        'width' => 'narrow',
                    ]],
                ],
            ],
            [
                'slug' => 'autumn-notes',
                'title' => 'Autumn notes',
                'status' => Page::STATUS_SCHEDULED,
                'author' => $editor,
                'excerpt' => 'A short letter about what we are making this autumn.',
                'seo_title' => 'Autumn notes — Northwind Studio',
                'seo_description' => 'A letter from the studio about the work on the table this autumn.',
                'featured' => 'type',
                'schedule_in' => 6,
                'sections' => [
                    ['rich-text', [
                        'heading' => 'What is on the table',
                        'body' => "Two identities for museums, a type specimen for a foundry in Leipzig, and a website for a bakery that has been in the same family since 1911.\n\nWe will write about all three once they are out in the world.",
                        'width' => 'narrow',
                    ]],
                ],
            ],
            [
                'slug' => 'careers',
                'title' => 'Careers',
                'status' => Page::STATUS_DRAFT,
                'author' => $admin,
                'excerpt' => 'We are not hiring — but we always read letters.',
                'seo_title' => null,
                'seo_description' => null,
                'featured' => null,
                'sections' => [
                    ['rich-text', [
                        'heading' => 'Working here',
                        'body' => "Six people, four days in the studio, one day for whatever keeps you curious.\n\nWe are not hiring right now. If that changes, this page changes first.",
                        'width' => 'narrow',
                    ]],
                ],
            ],
            [
                'slug' => 'old-landing',
                'title' => 'Old landing',
                'status' => Page::STATUS_PUBLISHED,
                'author' => $admin,
                'excerpt' => 'The 2019 landing page, kept in the bin for reference.',
                'seo_title' => null,
                'seo_description' => null,
                'featured' => null,
                'trashed' => true,
                'sections' => [
                    ['hero', [
                        'eyebrow' => 'Archive',
                        'heading' => 'We make brands that behave',
                        'body' => 'The homepage we ran from 2019 to 2023.',
                        'align' => 'center',
                        'cta_label' => '',
                        'cta_url' => '',
                        'image' => null,
                    ]],
                ],
            ],
        ];

        $pages = [];

        foreach ($definitions as $index => $definition) {
            // `updateOrCreate` cannot see a trashed page, so the row is looked up
            // with trashed rows included and restored before it is filled.
            $page = Page::query()->withTrashed()->firstOrNew(['slug' => $definition['slug']]);

            $page->fill([
                'title' => $definition['title'],
                'status' => $definition['status'],
                'template' => 'page',
                'parent_id' => null,
                'author_id' => $definition['author']->id,
                'excerpt' => $definition['excerpt'],
                'featured_media_id' => $definition['featured'] !== null ? ($media[$definition['featured']] ?? null)?->id : null,
                'content' => array_map(
                    fn (array $block): array => $this->block($block[0], $block[1]),
                    $definition['sections'],
                ),
                'seo_title' => $definition['seo_title'],
                'seo_description' => $definition['seo_description'],
                'robots' => 'index,follow',
                'published_at' => $definition['status'] === Page::STATUS_PUBLISHED ? now()->subDays(90 - ($index * 9)) : null,
                'scheduled_at' => isset($definition['schedule_in']) ? now()->addDays($definition['schedule_in']) : null,
                'deleted_at' => null,
            ]);

            $page->save();

            if ($page->revisions()->count() === 0) {
                $page->revisions()->create([
                    'user_id' => $definition['author']->id,
                    'title' => $page->title,
                    'content' => $page->content,
                    'label' => 'Created',
                    'created_at' => now()->subDays(100),
                ]);

                $page->revisions()->create([
                    'user_id' => $definition['author']->id,
                    'title' => $page->title,
                    'content' => $page->content,
                    'label' => 'Copy pass',
                    'created_at' => now()->subDays(92),
                ]);
            }

            if (($definition['trashed'] ?? false) && ! $page->trashed()) {
                $page->delete();
            }

            $pages[$definition['slug']] = $page;
        }

        return $pages;
    }

    /**
     * @param  array<string, mixed>  $content
     * @return array<string, mixed>
     */
    private function block(string $section, array $content): array
    {
        return [
            'id' => (string) Str::uuid(),
            'section' => $section,
            'enabled' => true,
            'content' => $content,
        ];
    }

    /**
     * @param  array<string, Media>  $media
     */
    private function settings(array $media): void
    {
        $settings = app(SettingRepository::class);

        $settings->put('general', [
            'site_name' => 'Northwind Studio',
            'tagline' => 'Design for things that last',
            'description' => 'An independent design studio in Hannover working on identity, product and print.',
            'locale' => 'en',
            'timezone' => 'Europe/Berlin',
        ]);

        $settings->put('branding', [
            'logo' => ($media['wordmark'] ?? null)?->id,
            'favicon' => ($media['wordmark'] ?? null)?->id,
            'accent_color' => '#4338ca',
        ]);

        $settings->put('seo', [
            'meta_title' => 'Northwind Studio — identity, product and print',
            'meta_description' => 'An independent design studio in Hannover working on identity, product and print since 2002.',
            'robots' => 'index',
        ]);

        $settings->put('content', [
            'homepage_slug' => 'home',
            'allow_comments' => false,
            'posts_per_page' => 6,
            'rss_items' => 20,
        ]);

        $settings->put('mail', [
            'from_name' => 'Northwind Studio',
            'from_address' => 'studio@northwind.test',
            'reply_to' => 'studio@northwind.test',
            'transport' => 'log',
            'host' => '127.0.0.1',
            'port' => 1025,
            'username' => '',
        ]);
    }

    /**
     * Themes on disk and the addons that ship with the demo.
     */
    private function extensions(): void
    {
        $themes = app(ThemeRepository::class);

        foreach ($themes->discovered() as $manifest) {
            if ($themes->find($manifest->handle) === null) {
                $themes->install($manifest);
            }
        }

        if (app(ThemeManager::class)->active()?->handle !== 'aperture') {
            app(ThemeManager::class)->activate('aperture');
        }

        $addons = app(AddonRepository::class);
        $manager = app(AddonManager::class);

        foreach ($addons->discovered() as $manifest) {
            if ($manifest->handle === 'Shopper') {
                continue;
            }

            if ($addons->find($manifest->handle) === null) {
                $manager->install($manifest);
            }
        }

        if (($addons->find('PostCraft')?->status) !== 'active') {
            $manager->activate('PostCraft');
        }
    }

    /**
     * @param  array<string, Media>  $media
     */
    private function posts(User $author, array $media): void
    {
        // Posts live in PostCraft's tables; nothing to do when it is not installed.
        if (app(AddonRepository::class)->find('PostCraft') === null) {
            return;
        }

        $categories = [
            'craft' => 'Craft',
            'studio' => 'Studio',
            'process' => 'Process',
        ];

        $categoryIds = [];

        foreach ($categories as $slug => $name) {
            $categoryIds[$slug] = Category::query()->firstOrCreate(['slug' => $slug], ['name' => $name])->id;
        }

        $tagIds = [];

        foreach (['typography', 'print', 'process', 'people'] as $slug) {
            $tagIds[$slug] = Tag::query()->firstOrCreate(['slug' => $slug], ['name' => ucfirst($slug)])->id;
        }

        $posts = [
            [
                'title' => 'Why we still draw with a pencil',
                'category' => 'craft',
                'tags' => ['process', 'print'],
                'media' => 'type',
                'days' => 12,
                'excerpt' => 'A pencil is the fastest way to find out whether an idea is any good.',
                'body' => "Every identity starts as a dozen thumbnails on a sheet of A3. It is not nostalgia; it is the cheapest way to test whether an idea survives being seen.\n\n## Speed is the point\n\nA pencil line is instant. Software invites you to polish a bad idea before you have noticed that it is bad.\n\n> If it does not work at five centimetres wide in pencil, it will not work at five metres in vinyl.\n\nWe digitise late, and only the shapes that earned it.",
            ],
            [
                'title' => 'A type system is a contract',
                'category' => 'studio',
                'tags' => ['typography'],
                'media' => 'editorial',
                'days' => 38,
                'excerpt' => 'Type scales are not decoration. They are the rules that keep a brand legible when twelve people are writing in it.',
                'body' => "Most guidelines fail because they describe taste instead of rules. A type system is the part that can be checked.\n\n## Three sizes, two weights\n\nWhen the system is small, people use it. When it is large, they invent.\n\n> Constraints are a courtesy to whoever comes next.",
            ],
            [
                'title' => 'Press checks are worth the train fare',
                'category' => 'craft',
                'tags' => ['print', 'process'],
                'media' => 'packaging',
                'days' => 64,
                'excerpt' => 'Screens lie about ink. Two hours on a press floor will teach you more than a week of proofs.',
                'body' => "A press check is the only moment where the thing you designed meets the thing that ships.\n\n## What to look for\n\nFirst sheet, tenth sheet, last sheet. Watch the ink density drift and ask the printer what they would do.",
            ],
            [
                'title' => 'Six people and a long table',
                'category' => 'studio',
                'tags' => ['people'],
                'media' => 'studio',
                'days' => 96,
                'excerpt' => 'Why we stayed small, and what it costs.',
                'body' => "We have been six people for eleven years. Every year someone asks whether we should grow, and every year the answer is the same: not if it means the people who pitch the work are not the people who make it.\n\n## What it costs\n\nWe say no to more than we say yes to. That is the whole trick.",
            ],
            [
                'title' => 'A design system is a maintenance contract',
                'category' => 'process',
                'tags' => ['process'],
                'media' => 'product',
                'days' => 128,
                'excerpt' => 'Shipping components is the easy half. The other half is who fixes them in year two.',
                'body' => "Handing over a Figma library is not a handover. A design system is live only if the tokens, the components and the documentation are versioned together.\n\n## Name an owner\n\nIf nobody owns the system, the system stops being one within a quarter.",
            ],
            [
                'title' => 'The archive is the studio',
                'category' => 'craft',
                'tags' => ['print', 'people'],
                'media' => 'archive',
                'days' => 152,
                'excerpt' => 'Every project we have finished is in a drawer. Clients borrow from it more than they know.',
                'body' => "We keep two flat files of everything we have printed: one for work that shipped, one for work that should have.\n\n## Why keep it\n\nBecause the fastest way to answer 'have we done this before?' is to open a drawer.",
            ],
        ];

        foreach ($posts as $definition) {
            $slug = Str::slug($definition['title']);

            $post = Post::query()->withTrashed()->firstOrNew(['slug' => $slug]);

            $post->fill([
                'title' => $definition['title'],
                'excerpt' => $definition['excerpt'],
                'body' => $definition['body'],
                'category_id' => $categoryIds[$definition['category']],
                'author_id' => $author->id,
                'featured_media_id' => $media[$definition['media']]?->id ?? null,
                'status' => Post::STATUS_PUBLISHED,
                'published_at' => now()->subDays($definition['days']),
            ]);

            $post->slug = $slug;
            $post->deleted_at = null;
            $post->save();

            $post->tags()->sync(array_map(fn (string $tag): int => $tagIds[$tag], $definition['tags']));
        }
    }

    /**
     * Eight weeks of page views so the dashboard chart has a shape on a fresh
     * demo. Deterministic: the same seed produces the same forecast every time.
     */
    private function traffic(): void
    {
        if (PageView::query()->exists()) {
            return;
        }

        mt_srand(11);
        $paths = ['/', '/services', '/about', '/contact', '/blog'];

        for ($day = 55; $day >= 0; $day--) {
            $date = now()->subDays($day);
            $base = 18 + (55 - $day) * 0.9;
            $weekend = in_array($date->dayOfWeek, [0, 6], true) ? 0.55 : 1.0;
            $hits = (int) round($base * $weekend * (0.75 + mt_rand(0, 50) / 100));

            for ($i = 0; $i < $hits; $i++) {
                PageView::query()->create([
                    'path' => $paths[mt_rand(0, count($paths) - 1)],
                    'created_at' => $date->copy()->setTime(mt_rand(7, 21), mt_rand(0, 59)),
                ]);
            }
        }
    }

    /**
     * @param  array<string, Page>  $pages
     */
    private function activity(User $admin, User $editor, array $pages): void
    {
        $want = 25;
        $have = Activity::query()->count();

        if ($have >= $want) {
            return;
        }

        $events = [
            ['pages', 'published', 'Published “Home”', $admin, 2, $pages['home'] ?? null],
            ['pages', 'updated', 'Updated the hero on “Services”', $editor, 3, $pages['services'] ?? null],
            ['settings', 'updated', 'Updated SEO defaults', $admin, 4, null],
            ['media', 'uploaded', 'Uploaded “Packaging for a coffee roastery”', $editor, 5, null],
            ['pages', 'created', 'Created a draft called “Careers”', $admin, 6, $pages['careers'] ?? null],
            ['users', 'invited', 'Invited pending@lattice.test as Editor', $admin, 7, null],
            ['pages', 'scheduled', 'Scheduled “Autumn notes”', $editor, 8, $pages['autumn-notes'] ?? null],
            ['settings', 'updated', 'Updated branding', $admin, 9, null],
            ['pages', 'updated', 'Rewrote the studio story on “About”', $editor, 11, $pages['about'] ?? null],
            ['media', 'updated', 'Wrote alt text for two images', $editor, 12, null],
            ['pages', 'published', 'Published “Imprint”', $admin, 14, $pages['imprint'] ?? null],
            ['users', 'updated', 'Changed a role from Author to Editor', $admin, 15, null],
            ['pages', 'updated', 'Tightened the contact copy', $editor, 17, $pages['contact'] ?? null],
            ['settings', 'updated', 'Updated the mail sender', $admin, 18, null],
            ['media', 'deleted', 'Deleted a duplicate upload', $editor, 20, null],
            ['pages', 'created', 'Created “Autumn notes”', $editor, 22, null],
            ['pages', 'published', 'Published “Contact”', $admin, 25, $pages['contact'] ?? null],
            ['settings', 'updated', 'Set the homepage to “Home”', $admin, 28, null],
            ['pages', 'updated', 'Fixed a broken link on “Services”', $editor, 31, $pages['services'] ?? null],
            ['media', 'uploaded', 'Uploaded the studio photograph', $editor, 34, null],
        ];

        $created = $have;

        foreach ($events as [$log, $event, $description, $user, $daysAgo, $subject]) {
            if ($created >= $want) {
                break;
            }

            $logger = activity($log)->event($event)->causedBy($user);

            if ($subject !== null) {
                $logger->performedOn($subject);
            }

            $logger->log($description);

            Activity::query()->latest('id')->first()?->forceFill(['created_at' => now()->subDays($daysAgo)])->save();

            $created++;
        }
    }
}
