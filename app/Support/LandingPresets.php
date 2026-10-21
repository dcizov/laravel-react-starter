<?php

namespace App\Support;

/**
 * Complete starting pages, like a WordPress pattern or page template. An admin applies one in the visual
 * editor, which replaces the draft. Nothing here reaches visitors until it is published.
 *
 * The section order follows common SaaS marketing pages: a sticky navigation bar, a hero with one clear
 * call to action, a logo strip, features, proof (statistics and quotes), pricing, questions, a closing call
 * to action, and a footer. The copy is written for an imaginary product, so it can be replaced freely.
 * Each preset picks different layouts and a different theme, so they look like three separate sites.
 *
 * Every block in here must pass LandingBlocks::validate(), which the tests check. Keep the item counts and
 * lengths within the limits in LandingBlocks::fieldRules().
 */
final class LandingPresets
{
    /**
     * @return list<array{key: string, label: string, description: string, blocks: list<array{id: string, type: string, data: array<string, mixed>, style?: array<string, mixed>}>, theme?: array<string, mixed>}>
     */
    public static function all(): array
    {
        return [
            [
                'key' => 'starter',
                'label' => __('SaaS'),
                'description' => __('The default. A product page with a sticky bar, a hero, feature bento, proof, pricing, questions, and a closing call to action.'),
                'blocks' => self::starter(),
            ],
            [
                'key' => 'launch',
                'label' => __('Product launch'),
                'description' => __('A floating bar, a split hero, a scrolling logo row, a feature list, focused pricing, and a masonry of quotes.'),
                'blocks' => self::frame(self::launch(), 1, 2, __('Ship faster with a page that is ready on day one.')),
                'theme' => self::oceanTheme(),
            ],
            [
                'key' => 'agency',
                'label' => __('Agency'),
                'description' => __('Editorial type, a quiet bar, a ruled logo grid, an approach in two columns, and a short list of questions.'),
                'blocks' => self::frame(self::agency(), 2, 1, __('Design and strategy for companies that care about the details.')),
                'theme' => self::editorialTheme(),
            ],
        ];
    }

    /**
     * The built-in page, used until an admin publishes their own. See LandingBlocks::defaults().
     *
     * @return list<array{id: string, type: string, data: array<string, mixed>, style?: array<string, mixed>}>
     */
    public static function starter(): array
    {
        return self::frame(self::starterSections(), 0, 0, __('A starter kit for Laravel and React.'));
    }

    /**
     * @return list<array{id: string, type: string, data: array<string, mixed>, style?: array<string, mixed>}>
     */
    private static function starterSections(): array
    {
        return [
            self::block('hero-main', 'hero', [
                'title' => __('Ship your SaaS on Laravel and React, not on setup.'),
                'text' => __('Accounts, roles, an admin area, a task board, and a visual page editor, already wired together and ready to change.'),
                'button_label' => __('Get started'),
                'button_url' => '/register',
            ], ['variant' => 0, 'align' => 'center']),
            self::block('logos-main', 'logos', [
                'title' => __('Built with the tools you already trust'),
                'items' => [['name' => 'Laravel'], ['name' => 'React'], ['name' => 'Inertia.js'], ['name' => 'Tailwind CSS'], ['name' => 'shadcn/ui'], ['name' => 'Spatie Permission']],
            ], ['variant' => 0]),
            self::block('features-main', 'features', [
                'title' => __('Everything you need to launch'),
                'items' => [
                    ['title' => __('Accounts'), 'text' => __('Sign up, sign in, reset a password, and edit your profile.'), 'icon' => 'lock'],
                    ['title' => __('Roles and permissions'), 'text' => __('Decide what each role can see and change.'), 'icon' => 'shield'],
                    ['title' => __('Admin area'), 'text' => __('Manage users, settings, and the page itself from one place.'), 'icon' => 'settings'],
                    ['title' => __('Task board'), 'text' => __('A sample feature with drag and drop, badges, and a detail drawer.'), 'icon' => 'layers'],
                    ['title' => __('Two languages'), 'text' => __('English and German, with right-to-left ready text.'), 'icon' => 'globe'],
                    ['title' => __('Visual editor'), 'text' => __('Build this page from blocks, then preview and publish it.'), 'icon' => 'palette'],
                ],
            ], ['variant' => 0]),
            self::block('stats-main', 'stats', [
                'title' => __('At a glance'),
                'items' => [
                    ['value' => '13', 'label' => __('Languages supported')],
                    ['value' => '2', 'label' => __('Languages included')],
                    ['value' => '2', 'label' => __('Built-in roles')],
                ],
            ], ['variant' => 2]),
            self::block('testimonials-main', 'testimonials', [
                'title' => __('Teams ship faster with it'),
                'items' => [
                    ['quote' => __('We went from idea to a live page in one afternoon.'), 'name' => 'Mara Schmidt', 'role' => __('Founder, Example Co.')],
                    ['quote' => __('The roles and audit log were already there. That saved us weeks.'), 'name' => 'Tom Becker', 'role' => __('CTO, Northwind')],
                    ['quote' => __('Clean code, sensible defaults, and nothing we had to unlearn.'), 'name' => 'Lena Hoffmann', 'role' => __('Engineering lead, Globex')],
                ],
            ], ['variant' => 1]),
            self::block('pricing-main', 'pricing', [
                'title' => __('Simple pricing'),
                'items' => [
                    ['name' => __('Starter'), 'price' => '€0', 'period' => __('/month'), 'description' => __('Try it out.'), 'features' => __('Up to 3 users')."\n".__('Community support'), 'button_label' => __('Start free'), 'button_url' => '/register'],
                    ['name' => __('Team'), 'badge' => __('Most popular'), 'price' => '€29', 'period' => __('/month'), 'description' => __('For a growing team.'), 'features' => __('Unlimited users')."\n".__('Roles and permissions')."\n".__('Email support'), 'button_label' => __('Choose Team'), 'button_url' => '/register'],
                    ['name' => __('Business'), 'price' => '€99', 'period' => __('/month'), 'description' => __('For larger organisations.'), 'features' => __('Everything in Team')."\n".__('Priority support'), 'button_label' => __('Contact sales'), 'button_url' => '/register'],
                ],
            ], ['variant' => 0]),
            self::block('faq-main', 'faq', [
                'title' => __('Questions'),
                'items' => [
                    ['question' => __('How do I change what visitors see?'), 'answer' => __('Open the Visual editor, change the blocks, and save a draft. Preview shows the draft, and Publish makes it live.')],
                    ['question' => __('Can I use my own logo?'), 'answer' => __('Yes. Upload it in the settings, and the navigation bar and footer show it next to the app name.')],
                    ['question' => __('Is the page translated?'), 'answer' => __('The interface is. Your own text is kept as you write it, so translate the blocks yourself.')],
                ],
            ], ['variant' => 0]),
            self::block('cta-main', 'cta', [
                'title' => __('Ready to build?'),
                'text' => __('Create an account, or sign in to go to your dashboard.'),
                'button_label' => __('Create an account'),
                'button_url' => '/register',
            ], ['variant' => 0]),
        ];
    }

    /**
     * @return list<array{id: string, type: string, data: array<string, mixed>, style?: array<string, mixed>}>
     */
    private static function launch(): array
    {
        return [
            self::block('hero-launch', 'hero', [
                'title' => __('Launch on Monday, not next quarter.'),
                'text' => __('Everything a product needs on day one, already in place: accounts, a page, and a dashboard that is ready to grow.'),
                'button_label' => __('Start now'),
                'button_url' => '/register',
            ], ['variant' => 1]),
            self::block('logos-launch', 'logos', [
                'title' => __('Trusted by early teams'),
                'items' => [['name' => 'Northwind'], ['name' => 'Globex'], ['name' => 'Initech'], ['name' => 'Umbrella'], ['name' => 'Hooli'], ['name' => 'Stark']],
            ], ['variant' => 1]),
            self::block('features-launch', 'features', [
                'title' => __('What you get on day one'),
                'items' => [
                    ['title' => __('Ready in minutes'), 'text' => __('Install, set a name and a logo, and you have a working product.'), 'icon' => 'rocket'],
                    ['title' => __('Secure by default'), 'text' => __('Sign-in, password reset, and roles are built in, not bolted on.'), 'icon' => 'shield'],
                    ['title' => __('Measure what matters'), 'text' => __('A dashboard with the numbers you check every morning.'), 'icon' => 'chart'],
                ],
            ], ['variant' => 1]),
            self::block('stats-launch', 'stats', [
                'items' => [
                    ['value' => '1', 'label' => __('Day to launch')],
                    ['value' => '3', 'label' => __('Ready-made pages')],
                    ['value' => '0', 'label' => __('Lines of setup')],
                ],
            ], ['variant' => 1]),
            self::block('pricing-launch', 'pricing', [
                'title' => __('Pick a plan for launch week'),
                'items' => [
                    ['name' => __('Launch'), 'price' => '€0', 'period' => __('/month'), 'description' => __('For the first 100 users.'), 'features' => __('Your own domain')."\n".__('Basic analytics'), 'button_label' => __('Start free'), 'button_url' => '/register'],
                    ['name' => __('Growth'), 'badge' => __('Recommended'), 'price' => '€49', 'period' => __('/month'), 'description' => __('For the team that is scaling.'), 'features' => __('Unlimited users')."\n".__('Custom roles')."\n".__('Priority email support'), 'button_label' => __('Choose Growth'), 'button_url' => '/register'],
                ],
            ], ['variant' => 2]),
            self::block('testimonials-launch', 'testimonials', [
                'title' => __('What early users say'),
                'items' => [
                    ['quote' => __('It felt like we had a team of engineers setting it up for us.'), 'name' => 'Priya Nair', 'role' => __('Product, Hooli')],
                    ['quote' => __('The editor let our marketing team ship the page without a ticket.'), 'name' => 'Jonas Weber', 'role' => __('Marketing, Stark')],
                    ['quote' => __('Every screen looks finished. That is rare on day one.'), 'name' => 'Aiko Tanaka', 'role' => __('Designer, Umbrella')],
                    ['quote' => __('We kept the defaults and changed only the words.'), 'name' => 'Sam Okafor', 'role' => __('Founder, Initech')],
                ],
            ], ['variant' => 2]),
            self::block('cta-launch', 'cta', [
                'title' => __('Your launch page is one click away.'),
                'text' => __('Apply this layout, edit the words, then publish.'),
                'button_label' => __('Start now'),
                'button_url' => '/register',
            ], ['variant' => 1]),
        ];
    }

    /**
     * @return list<array{id: string, type: string, data: array<string, mixed>, style?: array<string, mixed>}>
     */
    private static function agency(): array
    {
        return [
            self::block('hero-agency', 'hero', [
                'title' => __('We make products that look as careful as they work.'),
                'text' => __('A small team for companies that want a site that looks considered and works hard.'),
                'button_label' => __('Talk to us'),
                'button_url' => '/register',
            ], ['variant' => 2]),
            self::block('logos-agency', 'logos', [
                'title' => __('Selected clients'),
                'items' => [['name' => 'Northwind'], ['name' => 'Globex'], ['name' => 'Initech'], ['name' => 'Umbrella'], ['name' => 'Hooli'], ['name' => 'Stark']],
            ], ['variant' => 2]),
            self::block('text-agency', 'text', [
                'heading' => __('Our approach'),
                'body' => __('We begin with the questions a product must answer, then design the simplest structure that answers them. Strategy, design, and build happen in one team, so nothing is lost between handovers.'),
            ], ['variant' => 2]),
            self::block('features-agency', 'features', [
                'title' => __('How we work'),
                'items' => [
                    ['title' => __('Discovery'), 'text' => __('Two weeks of interviews and a plain-language brief.'), 'icon' => 'sparkles'],
                    ['title' => __('Design'), 'text' => __('Layouts and type, tested with the people who will use them.'), 'icon' => 'palette'],
                    ['title' => __('Build'), 'text' => __('Clean code and a page your team can edit without us.'), 'icon' => 'check'],
                ],
            ], ['variant' => 2]),
            self::block('testimonials-agency', 'testimonials', [
                'title' => __('In their words'),
                'items' => [
                    ['quote' => __('They asked better questions than our own board did.'), 'name' => 'Clara Dunn', 'role' => __('CEO, Globex')],
                    ['quote' => __('Careful work, delivered on the date they promised.'), 'name' => 'Ben Adler', 'role' => __('Director, Initech')],
                ],
            ], ['variant' => 1]),
            self::block('faq-agency', 'faq', [
                'title' => __('Common questions'),
                'items' => [
                    ['question' => __('Do you work with small teams?'), 'answer' => __('Yes. Most of our clients have fewer than fifty people.')],
                    ['question' => __('Who owns the work?'), 'answer' => __('You do. Every file and every line of code is handed over.')],
                ],
            ], ['variant' => 1]),
            self::block('cta-agency', 'cta', [
                'title' => __('Tell us what you are building.'),
                'text' => __('A short call is enough to see whether we are a good fit.'),
                'button_label' => __('Book a call'),
                'button_url' => '/register',
            ], ['variant' => 2]),
        ];
    }

    private static function oceanTheme(): array
    {
        return [
            'primary' => '#0369a1',
            'background' => '#f8fbff',
            'foreground' => '#0f172a',
            'radius' => 0.75,
            'font' => 'sans',
            'text_size' => 'md',
        ];
    }

    private static function editorialTheme(): array
    {
        return [
            'primary' => '#1e3a8a',
            'background' => '#faf7f2',
            'foreground' => '#1c1917',
            'radius' => 0,
            'font' => 'serif',
            'text_size' => 'lg',
        ];
    }

    /**
     * Adds a navigation bar above and a footer below the sections. The bar links to the sections that exist on
     * the page, so none of them point at a missing anchor. The footer repeats those links and adds an account
     * column. Its copyright line is left empty, so the app name and the current year are used.
     *
     * @param  list<array{id: string, type: string, data: array<string, mixed>, style?: array<string, mixed>}>  $sections
     * @return list<array{id: string, type: string, data: array<string, mixed>, style?: array<string, mixed>}>
     */
    private static function frame(array $sections, int $navVariant, int $footerVariant, string $tagline): array
    {
        $present = array_column($sections, 'type');
        $names = [
            'features' => __('Features'),
            'stats' => __('Results'),
            'testimonials' => __('Stories'),
            'pricing' => __('Pricing'),
            'faq' => __('FAQ'),
        ];

        $links = [];

        foreach ($names as $type => $label) {
            if (in_array($type, $present, true)) {
                $links[] = ['label' => $label, 'url' => '#'.$type];
            }
        }

        $links = array_slice($links, 0, 5);

        $navbar = self::block('nav-main', 'navbar', [
            'items' => $links,
            'button_label' => __('Get started'),
            'button_url' => '/register',
        ], ['variant' => $navVariant]);

        $footer = self::block('footer-main', 'footer', [
            'text' => $tagline,
            'columns' => [
                ['title' => __('Page'), 'links' => $links],
                ['title' => __('Account'), 'links' => [
                    ['label' => __('Log in'), 'url' => '/login'],
                    ['label' => __('Register'), 'url' => '/register'],
                ]],
            ],
        ], ['variant' => $footerVariant]);

        return [$navbar, ...$sections, $footer];
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, mixed>|null  $style
     * @return array{id: string, type: string, data: array<string, mixed>, style?: array<string, mixed>}
     */
    private static function block(string $id, string $type, array $data, ?array $style = null): array
    {
        $block = ['id' => $id, 'type' => $type, 'data' => $data];

        if ($style !== null) {
            $block['style'] = $style;
        }

        return $block;
    }
}
