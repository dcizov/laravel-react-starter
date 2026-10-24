<?php

declare(strict_types=1);

namespace App\Cms\Settings;

use Illuminate\Validation\Rule;

/**
 * The settings screen is built from this declaration: groups, typed fields,
 * validation and which values are public. Adding a setting is a data change —
 * no controller, no React form, no migration.
 */
final class SettingSchema
{
    public const TYPES = ['string', 'text', 'integer', 'boolean', 'select', 'email', 'secret', 'media', 'color'];

    /**
     * @return array<string, array{label: string, description: string, icon: string, fields: list<array<string, mixed>>}>
     */
    public static function groups(): array
    {
        return [
            'general' => [
                'label' => 'General',
                'description' => 'The name, language and timezone the whole site reports.',
                'icon' => 'settings',
                'fields' => [
                    self::define('site_name', 'Site name', 'string', [
                        'public' => true, 'required' => true, 'rules' => ['max:80'],
                        'hint' => 'Used in the header, the browser tab and the sitemap.',
                    ]),
                    self::define('tagline', 'Tagline', 'string', ['public' => true, 'rules' => ['max:120']]),
                    self::define('description', 'Description', 'text', ['public' => true, 'rules' => ['max:300']]),
                    self::define('locale', 'Language', 'select', [
                        'public' => true, 'default' => 'en',
                        'options' => [['value' => 'en', 'label' => 'English'], ['value' => 'de', 'label' => 'German']],
                    ]),
                    self::define('timezone', 'Timezone', 'string', [
                        'default' => 'Europe/Berlin', 'rules' => ['max:64'],
                        'hint' => 'Scheduling and activity timestamps are stored in UTC and shown in this zone.',
                    ]),
                ],
            ],
            'branding' => [
                'label' => 'Branding',
                'description' => 'Logo, favicon and the accent colour of the public site.',
                'icon' => 'palette',
                'fields' => [
                    self::define('logo', 'Logo', 'media', [
                        'public' => true,
                        'hint' => 'Shown in the header instead of the default mark. SVG or PNG on a transparent background.',
                    ]),
                    self::define('favicon', 'Favicon', 'media', [
                        'public' => true,
                        'hint' => 'Square image; the browser scales it down.',
                    ]),
                    self::define('accent_color', 'Accent colour', 'color', [
                        'public' => true,
                        'hint' => 'Overrides the theme accent. Leave empty to use the theme default.',
                    ]),
                ],
            ],
            'seo' => [
                'label' => 'SEO',
                'description' => 'Defaults for pages that do not set their own metadata.',
                'icon' => 'search',
                'fields' => [
                    self::define('meta_title', 'Default title', 'string', ['public' => true, 'rules' => ['max:60']]),
                    self::define('meta_description', 'Default description', 'text', [
                        'public' => true, 'rules' => ['max:160'],
                        'hint' => 'Search engines show about 160 characters.',
                    ]),
                    self::define('robots', 'Indexing', 'select', [
                        'public' => true, 'default' => 'index',
                        'options' => [
                            ['value' => 'index', 'label' => 'Allow search engines'],
                            ['value' => 'noindex', 'label' => 'Ask search engines to stay away'],
                        ],
                    ]),
                    self::define('google_verification', 'Verification token', 'string', [
                        'rules' => ['max:80'], 'hint' => 'The content value of the google-site-verification meta tag.',
                    ]),
                ],
            ],
            'content' => [
                'label' => 'Content',
                'description' => 'How the public site lists and exposes content.',
                'icon' => 'file-text',
                'fields' => [
                    self::define('homepage_slug', 'Homepage', 'string', [
                        'default' => 'home', 'rules' => ['max:80', 'regex:/^[a-z0-9][a-z0-9-]*$/'],
                        'hint' => 'The page served at /.',
                    ]),
                    self::define('allow_comments', 'Accept comments', 'boolean', ['public' => true, 'default' => false]),
                    self::define('posts_per_page', 'Posts per page', 'integer', [
                        'public' => true, 'default' => 9, 'rules' => ['min:1', 'max:48'],
                    ]),
                    self::define('rss_items', 'Items in the feed', 'integer', ['default' => 20, 'rules' => ['min:1', 'max:100']]),
                ],
            ],
            'mail' => [
                'label' => 'Mail',
                'description' => 'The sender invitations and password resets come from.',
                'icon' => 'mail',
                'fields' => [
                    self::define('from_name', 'From name', 'string', ['rules' => ['max:80']]),
                    self::define('from_address', 'From address', 'email', ['required' => true, 'rules' => ['max:120']]),
                    self::define('reply_to', 'Reply-to', 'email', ['rules' => ['max:120']]),
                    self::define('transport', 'Transport', 'select', [
                        'default' => 'log',
                        'options' => [
                            ['value' => 'log', 'label' => 'Log (development)'],
                            ['value' => 'smtp', 'label' => 'SMTP'],
                        ],
                    ]),
                    self::define('host', 'Host', 'string', ['rules' => ['max:120']]),
                    self::define('port', 'Port', 'integer', ['default' => 587, 'rules' => ['min:1', 'max:65535']]),
                    self::define('username', 'Username', 'string', ['rules' => ['max:120']]),
                    self::define('password', 'Password', 'secret', [
                        'hint' => 'Stored encrypted at rest and never sent to the browser.',
                    ]),
                ],
            ],
        ];
    }

    /**
     * @return array{label: string, description: string, icon: string, fields: list<array<string, mixed>>}|null
     */
    public static function group(string $group): ?array
    {
        return self::groups()[$group] ?? null;
    }

    /**
     * @return list<string>
     */
    public static function handles(): array
    {
        return array_keys(self::groups());
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function find(string $key): ?array
    {
        foreach (self::groups() as $group) {
            foreach ($group['fields'] as $field) {
                if ($field['key'] === $key) {
                    return $field;
                }
            }
        }

        return null;
    }

    /**
     * Validation for the fields a request actually contains. Unknown keys are
     * ignored rather than validated, so a partial save (a single switch) and a
     * full form save share one endpoint.
     *
     * @param  array<string, mixed>  $input
     * @return array<string, list<mixed>>
     */
    public static function rules(string $group, array $input): array
    {
        $rules = [];

        foreach (self::group($group)['fields'] ?? [] as $field) {
            if (! array_key_exists($field['key'], $input)) {
                continue;
            }

            $rules[$field['key']] = self::rulesFor($field);
        }

        return $rules;
    }

    /**
     * @param  array<string, mixed>  $field
     * @return list<mixed>
     */
    private static function rulesFor(array $field): array
    {
        $required = (bool) ($field['required'] ?? false);

        $base = match ($field['type']) {
            'integer' => ['integer'],
            'boolean' => ['boolean'],
            'email' => ['string', 'email', 'max:255'],
            'select' => ['string', Rule::in(array_column($field['options'] ?? [], 'value'))],
            'media' => ['nullable', 'integer', Rule::exists('media', 'id')->whereNull('deleted_at')],
            'color' => ['nullable', 'string', 'regex:/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/'],
            'text' => ['string', 'max:2000'],
            default => ['string', 'max:255'],
        };

        return [$required ? 'required' : 'nullable', ...$base, ...($field['rules'] ?? [])];
    }

    /**
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    private static function define(string $key, string $label, string $type, array $options = []): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'type' => $type,
            'default' => $options['default'] ?? null,
            'required' => $options['required'] ?? false,
            'public' => $options['public'] ?? false,
            'hint' => $options['hint'] ?? null,
            'options' => $options['options'] ?? [],
            'rules' => $options['rules'] ?? [],
        ];
    }
}
