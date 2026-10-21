<?php

namespace App\Support;

/**
 * Complete starting pages, like a WordPress pattern or page template. An admin applies one in the visual
 * editor, which replaces the draft. Nothing here reaches visitors until it is published.
 *
 * The layouts follow the usual order of a SaaS marketing page: a sticky navigation bar, a hero with one clear
 * call to action, a logo strip, features, proof, pricing, questions, a closing call to action, and a footer.
 * Each preset picks different layouts and a different theme, so they look like three separate sites.
 *
 * Every block in here must pass LandingBlocks::validate(), which the tests check.
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
                'description' => __('The default. A product page with a sticky bar, features, pricing, and a closing call to action.'),
                'blocks' => self::starter(),
            ],
            [
                'key' => 'launch',
                'label' => __('Product launch'),
                'description' => __('A floating bar, a centred hero, a launch timeline of features, and a two-column price table.'),
                'blocks' => self::frame(self::launch(), 1, 2, __('Ship faster with a page that is ready on day one.')),
                'theme' => self::oceanTheme(),
            ],
            [
                'key' => 'agency',
                'label' => __('Agency'),
                'description' => __('Editorial type, a quiet bar, a short approach, and quotes in a wall.'),
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
            self::block('default-hero', 'hero', [
                'title' => 'Ship your SaaS on Laravel and React, not on setup',
                'text' => 'Accounts, roles, an admin area, a task board, and a visual page editor, already wired together and ready to change.',
                'button_label' => 'Get started',
                'button_url' => '/register',
            ], ['variant' => 0, 'padding' => 'lg', 'text_effect' => 'words']),
            self::block('default-logos', 'logos', [
                'title' => 'Built with the tools you already trust',
                'items' => [
                    ['name' => 'Laravel'],
                    ['name' => 'React'],
                    ['name' => 'Inertia.js'],
                    ['name' => 'Tailwind CSS'],
                    ['name' => 'shadcn/ui'],
                    ['name' => 'Spatie Permission'],
                ],
            ], ['variant' => 0]),
            self::block('default-features', 'features', [
                'title' => 'Everything you need to launch',
                'items' => [
                    ['title' => 'Accounts', 'text' => 'Sign up, sign in, reset a password, and edit your profile.', 'icon' => 'lock'],
                    ['title' => 'Roles and permissions', 'text' => 'Decide what each role can see and change.', 'icon' => 'shield'],
                    ['title' => 'Admin area', 'text' => 'Manage users, roles, the audit log, and app settings.', 'icon' => 'settings'],
                    ['title' => 'Task board', 'text' => 'A sample feature with drag-and-drop ordering saved for each user.', 'icon' => 'layers'],
                    ['title' => 'Two languages', 'text' => 'English and German, with light and dark mode.', 'icon' => 'globe'],
                    ['title' => 'Visual editor', 'text' => 'Build this page from blocks, then preview and publish it.', 'icon' => 'palette'],
                ],
            ], ['variant' => 0]),
            self::block('default-stats', 'stats', [
                'title' => 'At a glance',
                'items' => [
                    ['value' => '13', 'label' => 'Laravel major version'],
                    ['value' => '2', 'label' => 'Languages included'],
                    ['value' => '2', 'label' => 'Built-in roles: admin and user'],
                ],
            ], ['variant' => 0]),
            self::block('default-testimonials', 'testimonials', [
                'title' => 'Teams ship faster with it',
                'items' => [
                    ['quote' => 'We went from idea to a live page in one afternoon.', 'name' => 'Maria Schmidt', 'role' => 'Founder, Example GmbH'],
                    ['quote' => 'The roles and audit log were already there. That saved us weeks.', 'name' => 'Tom Becker', 'role' => 'Engineering lead'],
                    ['quote' => 'Clean code, sensible defaults, and nothing we had to unpick.', 'name' => 'Lena Hoffmann', 'role' => 'CTO'],
                ],
            ], ['variant' => 0]),
            self::block('default-pricing', 'pricing', [
                'title' => 'Simple pricing',
                'items' => [
                    ['name' => 'Starter', 'price' => '€0', 'period' => '/month', 'description' => 'To try it out.', 'features' => "Up to 3 users\nCommunity support", 'button_label' => 'Start free', 'button_url' => '/register'],
                    ['name' => 'Team', 'badge' => 'Most popular', 'price' => '€29', 'period' => '/month', 'description' => 'For a growing team.', 'features' => "Unlimited users\nRoles and permissions\nEmail support", 'button_label' => 'Choose Team', 'button_url' => '/register'],
                    ['name' => 'Business', 'price' => '€99', 'period' => '/month', 'description' => 'For larger organisations.', 'features' => "Everything in Team\nPriority support", 'button_label' => 'Contact sales', 'button_url' => '/register'],
                ],
            ], ['variant' => 0]),
            self::block('default-faq', 'faq', [
                'title' => 'Questions',
                'items' => [
                    ['question' => 'How do I change what visitors see?', 'answer' => 'Open the Visual editor, change the blocks, and save a draft. Preview shows the draft, and Publish makes it live.'],
                    ['question' => 'Can I turn this page off?', 'answer' => 'Yes. With the landing page switched off, visitors go straight to sign in, or to the dashboard when they are signed in.'],
                    ['question' => 'Can I add more sections?', 'answer' => 'Yes, up to the limit for each block type. Add a block from the palette and drag it into place.'],
                ],
            ], ['variant' => 0]),
            self::block('default-cta', 'cta', [
                'title' => 'Ready to build?',
                'text' => 'Create an account, or sign in to go to your dashboard.',
                'button_label' => 'Create an account',
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
            self::block('launch-hero', 'hero', [
                'title' => 'Launch your product in days, not months',
                'text' => 'A polished site with sign-up, a dashboard, and a pricing page, already in place for the first visitors.',
                'button_label' => 'Start free trial',
                'button_url' => '/register',
            ], ['variant' => 0, 'padding' => 'lg', 'text_effect' => 'words']),
            self::block('launch-logos', 'logos', [
                'title' => 'Trusted by teams at',
                'items' => [['name' => 'Acme'], ['name' => 'Northwind'], ['name' => 'Globex'], ['name' => 'Initech']],
            ], ['variant' => 1]),
            self::block('launch-features', 'features', [
                'title' => 'Everything to launch',
                'items' => [
                    ['title' => 'Set up in minutes', 'text' => 'Sign-up, accounts, and an admin area are ready on the first run.', 'icon' => 'rocket'],
                    ['title' => 'Secure by default', 'text' => 'Roles and permissions decide who can see and change what.', 'icon' => 'shield'],
                    ['title' => 'Built to grow', 'text' => 'Add pages, blocks, and features without rewriting the basics.', 'icon' => 'layers'],
                ],
            ], ['variant' => 1]),
            self::block('launch-testimonials', 'testimonials', [
                'title' => 'Teams are shipping faster',
                'items' => [
                    ['quote' => 'We went from idea to a live page in one afternoon.', 'name' => 'Maria Schmidt', 'role' => 'Founder, Example GmbH'],
                    ['quote' => 'The roles and audit log were already there. That saved us weeks.', 'name' => 'Tom Becker', 'role' => 'Engineering lead'],
                ],
            ], ['variant' => 1]),
            self::block('launch-pricing', 'pricing', [
                'title' => 'Simple pricing',
                'items' => [
                    ['name' => 'Starter', 'price' => '€0', 'period' => '/month', 'description' => 'To try it out.', 'features' => "Up to 3 users\nCommunity support", 'button_label' => 'Start free', 'button_url' => '/register'],
                    ['name' => 'Team', 'badge' => 'Most popular', 'price' => '€29', 'period' => '/month', 'description' => 'For a growing team.', 'features' => "Unlimited users\nRoles and permissions\nEmail support", 'button_label' => 'Choose Team', 'button_url' => '/register'],
                    ['name' => 'Business', 'price' => '€99', 'period' => '/month', 'description' => 'For larger organisations.', 'features' => "Everything in Team\nPriority support", 'button_label' => 'Contact sales', 'button_url' => '/register'],
                ],
            ], ['variant' => 1]),
            self::block('launch-faq', 'faq', [
                'title' => 'Questions',
                'items' => [
                    ['question' => 'Can I change the colours?', 'answer' => 'Yes. The theme sets the primary colour, background, text colour, corner radius, font, and text size.'],
                    ['question' => 'Can I cancel at any time?', 'answer' => 'Yes. There is no contract, and you keep access until the end of the billing period.'],
                ],
            ], ['variant' => 2]),
            self::block('launch-cta', 'cta', [
                'title' => 'Ship it this week',
                'text' => 'Start on the free plan and upgrade when your team grows.',
                'button_label' => 'Start free trial',
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
            self::block('agency-hero', 'hero', [
                'title' => 'We design and build digital products people remember',
                'text' => 'A small team for brands that want a site that looks considered and works hard.',
                'button_label' => 'Start a project',
                'button_url' => '/register',
            ], ['variant' => 2, 'padding' => 'xl', 'text_effect' => 'words']),
            self::block('agency-text', 'text', [
                'heading' => 'Our approach',
                'body' => 'We start with the question behind the product, then shape the story, the layout, and the build around it. Every decision is one we can explain.',
            ], ['variant' => 1]),
            self::block('agency-features', 'features', [
                'title' => 'What we do',
                'items' => [
                    ['title' => 'Strategy', 'text' => 'Positioning, messages, and a plan you can measure.'],
                    ['title' => 'Design', 'text' => 'Identity, pages, and the details that make them feel right.'],
                    ['title' => 'Build', 'text' => 'Fast, accessible sites that are easy to change afterwards.'],
                ],
            ], ['variant' => 2]),
            self::block('agency-stats', 'stats', [
                'title' => 'Results',
                'items' => [
                    ['value' => '40+', 'label' => 'Projects launched'],
                    ['value' => '2×', 'label' => 'Average increase in enquiries'],
                    ['value' => '98%', 'label' => 'Clients who came back'],
                ],
            ], ['variant' => 2]),
            self::block('agency-testimonials', 'testimonials', [
                'title' => 'In their words',
                'items' => [
                    ['quote' => 'They listened first, then delivered something better than our brief.', 'name' => 'Lena Hoffmann', 'role' => 'Marketing director'],
                    ['quote' => 'Calm, clear, and on time. Exactly what we needed.', 'name' => 'Jonas Weber', 'role' => 'Co-founder'],
                    ['quote' => 'Our new site doubled the number of enquiries in the first month.', 'name' => 'Sara Klein', 'role' => 'Owner'],
                ],
            ], ['variant' => 2]),
            self::block('agency-cta', 'cta', [
                'title' => 'Have a project in mind?',
                'text' => 'Tell us what you are working on. We reply within two working days.',
                'button_label' => 'Start a project',
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
     * the page, so none of them point at a missing anchor.
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
