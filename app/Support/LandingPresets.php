<?php

namespace App\Support;

/**
 * Complete starting pages, like a WordPress pattern or page template. An admin applies one in the visual
 * editor, which replaces the draft. Nothing here reaches visitors until it is published.
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
                'label' => __('Starter'),
                'description' => __('A simple page for a new product.'),
                'blocks' => self::starter(),
            ],
            [
                'key' => 'launch',
                'label' => __('Product launch'),
                'description' => __('Split hero, feature list, and a highlighted price.'),
                'blocks' => self::frame(self::launch(), 'Acme', 0, 2, 'Ship faster with a page that is ready on day one.'),
                'theme' => self::oceanTheme(),
            ],
            [
                'key' => 'agency',
                'label' => __('Agency'),
                'description' => __('Editorial type, quotes in a wall, and a quiet call to action.'),
                'blocks' => self::frame(self::agency(), 'Studio North', 2, 1, 'Design and strategy for companies that care about the details.'),
                'theme' => self::editorialTheme(),
            ],
        ];
    }

    /**
     * The built-in page, used until an admin publishes their own.
     *
     * @return list<array{id: string, type: string, data: array<string, mixed>, style?: array<string, mixed>}>
     */
    public static function starter(): array
    {
        return self::frame(self::starterSections(), 'Laravel Starter', 0, 0, 'A starter kit for Laravel and React.');
    }

    /**
     * @return list<array{id: string, type: string, data: array<string, mixed>, style?: array<string, mixed>}>
     */
    private static function starterSections(): array
    {
        return [
            self::block('default-hero', 'hero', [
                'title' => 'Start building your Laravel app today',
                'text' => 'A Laravel 13 and React 19 starter with accounts, roles and permissions, an admin area, and a task board. Change this page in the Visual Editor.',
                'button_label' => 'Get started',
                'button_url' => '/register',
                'image' => '',
            ], ['variant' => 0, 'padding' => 'lg', 'text_effect' => 'words']),
            self::block('default-logos', 'logos', [
                'title' => 'Built with',
                'items' => [
                    ['name' => 'Laravel'],
                    ['name' => 'React'],
                    ['name' => 'Inertia.js'],
                    ['name' => 'Tailwind CSS'],
                    ['name' => 'shadcn/ui'],
                    ['name' => 'Spatie Permission'],
                ],
            ], ['variant' => 1]),
            self::block('default-features', 'features', [
                'title' => 'What is included',
                'items' => [
                    ['title' => 'Accounts', 'text' => 'Sign up, sign in, reset a password, and edit your profile.', 'icon' => 'lock'],
                    ['title' => 'Roles and permissions', 'text' => 'Decide what each role can see and change.', 'icon' => 'shield'],
                    ['title' => 'Admin area', 'text' => 'Manage users, roles, permissions, the audit log, and app settings.', 'icon' => 'settings'],
                    ['title' => 'Task board', 'text' => 'A sample feature with drag-and-drop ordering that is saved for each user.', 'icon' => 'layers'],
                    ['title' => 'Two languages', 'text' => 'English and German, with light and dark mode.', 'icon' => 'globe'],
                    ['title' => 'Visual Editor', 'text' => 'Build this page from blocks, then preview and publish it.', 'icon' => 'palette'],
                ],
            ], ['variant' => 0]),
            self::block('default-stats', 'stats', [
                'title' => 'At a glance',
                'items' => [
                    ['value' => '13', 'label' => 'Laravel major version'],
                    ['value' => '2', 'label' => 'Languages included'],
                    ['value' => '2', 'label' => 'Built-in roles: admin and user'],
                ],
            ], ['variant' => 2]),
            self::block('default-faq', 'faq', [
                'title' => 'Questions',
                'items' => [
                    ['question' => 'How do I change what visitors see?', 'answer' => 'Open the Visual Editor, change the blocks, and save a draft. Preview shows the draft, and Publish makes it live.'],
                    ['question' => 'Can I turn this page off?', 'answer' => 'Yes. In Admin settings, switch off Show the landing page. Guests then go to sign in, and signed-in users go to the dashboard.'],
                    ['question' => 'Can I add more sections?', 'answer' => 'Yes. Add any block from the palette, in any order. A page can hold up to 40 blocks.'],
                ],
            ], ['variant' => 1]),
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
                'text' => 'Ship a polished site with sign-up, a dashboard, and a pricing page already in place.',
                'button_label' => 'Start free trial',
                'button_url' => '/register',
                'image' => '',
            ], ['variant' => 1, 'padding' => 'lg', 'text_effect' => 'words']),
            self::block('launch-logos', 'logos', [
                'title' => 'Trusted by teams at',
                'items' => [['name' => 'Acme'], ['name' => 'Northwind'], ['name' => 'Globex'], ['name' => 'Initech']],
            ], ['variant' => 0]),
            self::block('launch-features', 'features', [
                'title' => 'Everything to launch',
                'items' => [
                    ['title' => 'Set up in minutes', 'text' => 'Sign-in, accounts, and an admin area are ready on the first run.', 'icon' => 'rocket'],
                    ['title' => 'Secure by default', 'text' => 'Roles and permissions decide who can see and change what.', 'icon' => 'shield'],
                    ['title' => 'Built to grow', 'text' => 'Add pages, blocks, and features without rewriting the basics.', 'icon' => 'chart'],
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
            ], ['variant' => 2]),
            self::block('launch-faq', 'faq', [
                'title' => 'Questions',
                'items' => [
                    ['question' => 'Can I change the colours?', 'answer' => 'Yes. The page theme sets the colours, corners, and fonts for the whole page.'],
                    ['question' => 'Can I cancel at any time?', 'answer' => 'Yes. Nothing is locked in.'],
                ],
            ], ['variant' => 2]),
            self::block('launch-cta', 'cta', [
                'title' => 'Ready when you are',
                'text' => 'Create an account and make the page your own.',
                'button_label' => 'Create an account',
                'button_url' => '/register',
            ], ['variant' => 2]),
        ];
    }

    /**
     * @return list<array{id: string, type: string, data: array<string, mixed>, style?: array<string, mixed>}>
     */
    private static function agency(): array
    {
        return [
            self::block('agency-hero', 'hero', [
                'title' => 'We design and build websites people remember',
                'text' => 'A small team for brands that want clear design, careful engineering, and results they can measure.',
                'button_label' => 'Tell us about your project',
                'button_url' => '/register',
                'image' => '',
            ], ['variant' => 2, 'padding' => 'xl', 'text_effect' => 'words']),
            self::block('agency-text', 'text', [
                'heading' => 'About us',
                'body' => "We work with a few clients at a time, so every project gets our full attention.\nWe start with the goal, then shape the design and the build around it.",
            ], ['variant' => 2]),
            self::block('agency-features', 'features', [
                'title' => 'How we work',
                'items' => [
                    ['title' => 'Strategy', 'text' => 'We agree on what success looks like before any design starts.', 'icon' => 'layers'],
                    ['title' => 'Design', 'text' => 'Clear layouts and typography, tested with real people.', 'icon' => 'palette'],
                    ['title' => 'Development', 'text' => 'Fast, accessible pages that are easy to change later.', 'icon' => 'rocket'],
                ],
            ], ['variant' => 2]),
            self::block('agency-stats', 'stats', [
                'title' => '',
                'items' => [
                    ['value' => '40+', 'label' => 'Projects launched'],
                    ['value' => '98%', 'label' => 'Clients who come back'],
                    ['value' => '6', 'label' => 'Years in business'],
                ],
            ], ['variant' => 1]),
            self::block('agency-testimonials', 'testimonials', [
                'title' => 'Kind words',
                'items' => [
                    ['quote' => 'They listened first, then delivered something better than our brief.', 'name' => 'Lena Hoffmann', 'role' => 'Marketing director'],
                    ['quote' => 'Calm, clear, and on time. Exactly what we needed.', 'name' => 'Jonas Weber', 'role' => 'Co-founder'],
                    ['quote' => 'Our new site doubled the number of enquiries in the first month.', 'name' => 'Sara Klein', 'role' => 'Owner'],
                ],
            ], ['variant' => 2]),
            self::block('agency-cta', 'cta', [
                'title' => 'Tell us what you are working on',
                'text' => 'We reply within two working days.',
                'button_label' => 'Get in touch',
                'button_url' => '/register',
            ], ['variant' => 1]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
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

    /**
     * @return array<string, mixed>
     */
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
    private static function frame(array $sections, string $brand, int $navVariant, int $footerVariant, string $tagline): array
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
            'brand' => $brand,
            'items' => $links,
            'button_label' => __('Get started'),
            'button_url' => '/register',
        ], ['variant' => $navVariant]);

        $footer = self::block('footer-main', 'footer', [
            'brand' => $brand,
            'text' => $tagline,
            'columns' => [
                ['title' => __('Page'), 'links' => $links],
                ['title' => __('Account'), 'links' => [
                    ['label' => __('Log in'), 'url' => '/login'],
                    ['label' => __('Register'), 'url' => '/register'],
                ]],
            ],
            'copyright' => '© '.date('Y').' '.$brand.'. '.__('All rights reserved.'),
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
