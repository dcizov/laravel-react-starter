<?php

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * The landing page is a list of blocks. This class is the only place that decides which
 * blocks and fields are accepted, so nothing else can store content the public page would show.
 *
 * Text is always shown as plain text. Links must be http(s) or a path on this site.
 */
final class LandingBlocks
{
    public const TYPES = [
        'hero', 'features', 'text', 'image', 'button',
        'logos', 'stats', 'testimonials', 'pricing', 'faq', 'cta',
    ];

    public const MAX_BLOCKS = 40;

    // The icon keys a feature item may use. Must match FEATURE_ICONS in block-types.ts.
    public const FEATURE_ICONS = [
        'zap', 'shield', 'layers', 'users', 'chart', 'globe',
        'lock', 'sparkles', 'check', 'rocket', 'palette', 'settings',
    ];

    /**
     * The built-in page. Used until an admin publishes their own blocks.
     *
     * @return list<array{id: string, type: string, data: array<string, mixed>}>
     */
    public static function defaults(): array
    {
        return [
            [
                'id' => 'default-hero',
                'type' => 'hero',
                'data' => [
                    'title' => 'Start building your Laravel app today',
                    'text' => 'A Laravel 13 and React 19 starter with accounts, roles and permissions, an admin area, and a task board. Change this page in the Visual editor.',
                    'button_label' => 'Get started',
                    'button_url' => '/register',
                    'image' => '',
                ],
            ],
            [
                'id' => 'default-logos',
                'type' => 'logos',
                'data' => [
                    'title' => 'Built with',
                    'items' => [
                        ['name' => 'Laravel'],
                        ['name' => 'React'],
                        ['name' => 'Inertia.js'],
                        ['name' => 'Tailwind CSS'],
                        ['name' => 'shadcn/ui'],
                        ['name' => 'Spatie Permission'],
                    ],
                ],
            ],
            [
                'id' => 'default-features',
                'type' => 'features',
                'data' => [
                    'title' => 'What is included',
                    'items' => [
                        ['title' => 'Accounts', 'text' => 'Sign up, sign in, reset a password, and edit your profile.', 'icon' => 'lock'],
                        ['title' => 'Roles and permissions', 'text' => 'Decide what each role can see and change.', 'icon' => 'shield'],
                        ['title' => 'Admin area', 'text' => 'Manage users, roles, permissions, the audit log, and app settings.', 'icon' => 'settings'],
                        ['title' => 'Task board', 'text' => 'A sample feature with drag-and-drop ordering that is saved for each user.', 'icon' => 'layers'],
                        ['title' => 'Two languages', 'text' => 'English and German, with light and dark mode.', 'icon' => 'globe'],
                        ['title' => 'Visual editor', 'text' => 'Build this page from blocks, then preview and publish it.', 'icon' => 'palette'],
                    ],
                ],
            ],
            [
                'id' => 'default-stats',
                'type' => 'stats',
                'data' => [
                    'title' => 'At a glance',
                    'items' => [
                        ['value' => '13', 'label' => 'Laravel major version'],
                        ['value' => '2', 'label' => 'Languages included'],
                        ['value' => '2', 'label' => 'Built-in roles: admin and user'],
                    ],
                ],
            ],
            [
                'id' => 'default-faq',
                'type' => 'faq',
                'data' => [
                    'title' => 'Questions',
                    'items' => [
                        ['question' => 'How do I change what visitors see?', 'answer' => 'Open the Visual editor, change the blocks, and save a draft. Preview shows the draft, and Publish makes it live.'],
                        ['question' => 'Can I turn this page off?', 'answer' => 'Yes. In Admin settings, switch off Show the landing page. Guests then go to sign in, and signed-in users go to the dashboard.'],
                        ['question' => 'Can I add more sections?', 'answer' => 'Yes. Add any block from the palette, in any order. A page can hold up to 40 blocks.'],
                    ],
                ],
            ],
            [
                'id' => 'default-cta',
                'type' => 'cta',
                'data' => [
                    'title' => 'Ready to build?',
                    'text' => 'Create an account, or sign in to go to your dashboard.',
                    'button_label' => 'Create an account',
                    'button_url' => '/register',
                ],
            ],
        ];
    }

    /**
     * Checks a list of blocks from an admin and returns only the fields the block type allows.
     *
     * @param  mixed  $blocks  The raw list from the request.
     * @return list<array{id: string, type: string, data: array<string, mixed>}>
     *
     * @throws ValidationException
     */
    public static function validate(mixed $blocks): array
    {
        if (! is_array($blocks)) {
            throw ValidationException::withMessages(['blocks' => __('The blocks must be a list.')]);
        }

        $rules = [
            'blocks' => ['present', 'array', 'max:'.self::MAX_BLOCKS],
            'blocks.*.id' => ['distinct'],
        ];

        foreach ($blocks as $index => $block) {
            $type = is_array($block) ? ($block['type'] ?? null) : null;

            $rules["blocks.$index.id"] = ['required', 'string', 'regex:/^[A-Za-z0-9-]{1,40}$/'];
            $rules["blocks.$index.type"] = ['required', Rule::in(self::TYPES)];
            $rules["blocks.$index.data"] = ['required', 'array'];

            if (is_string($type) && in_array($type, self::TYPES, true)) {
                foreach (self::fieldRules($type) as $field => $fieldRules) {
                    $rules["blocks.$index.data.$field"] = $fieldRules;
                }
            }
        }

        $validated = Validator::make(['blocks' => $blocks], $rules)->validate()['blocks'];

        return array_values(array_map(fn (array $block) => [
            'id' => $block['id'],
            'type' => $block['type'],
            'data' => $block['data'],
        ], $validated));
    }

    /**
     * The fields each block type accepts. Anything not listed is dropped.
     *
     * @return array<string, list<mixed>>
     */
    public static function fieldRules(string $type): array
    {
        return match ($type) {
            'hero' => [
                'title' => ['required', 'string', 'max:120'],
                'text' => ['nullable', 'string', 'max:300'],
                'button_label' => ['nullable', 'string', 'max:40'],
                'button_url' => ['nullable', 'string', 'max:500', self::safeUrl()],
                'image' => ['nullable', 'string', 'max:500', self::safeUrl()],
            ],
            'features' => [
                'title' => ['nullable', 'string', 'max:120'],
                'items' => ['present', 'array', 'max:12'],
                'items.*.title' => ['required', 'string', 'max:80'],
                'items.*.text' => ['nullable', 'string', 'max:200'],
                'items.*.icon' => ['nullable', 'string', Rule::in(self::FEATURE_ICONS)],
            ],
            'text' => [
                'heading' => ['nullable', 'string', 'max:120'],
                'body' => ['required', 'string', 'max:2000'],
            ],
            'image' => [
                'src' => ['required', 'string', 'max:500', self::safeUrl()],
                'alt' => ['nullable', 'string', 'max:160'],
            ],
            'button' => [
                'label' => ['required', 'string', 'max:40'],
                'url' => ['required', 'string', 'max:500', self::safeUrl()],
            ],
            'logos' => [
                'title' => ['nullable', 'string', 'max:120'],
                'items' => ['present', 'array', 'max:12'],
                'items.*.name' => ['required', 'string', 'max:60'],
            ],
            'stats' => [
                'title' => ['nullable', 'string', 'max:120'],
                'items' => ['present', 'array', 'max:6'],
                'items.*.value' => ['required', 'string', 'max:20'],
                'items.*.label' => ['required', 'string', 'max:60'],
            ],
            'testimonials' => [
                'title' => ['nullable', 'string', 'max:120'],
                'items' => ['present', 'array', 'max:6'],
                'items.*.quote' => ['required', 'string', 'max:400'],
                'items.*.name' => ['required', 'string', 'max:80'],
                'items.*.role' => ['nullable', 'string', 'max:80'],
            ],
            'pricing' => [
                'title' => ['nullable', 'string', 'max:120'],
                'items' => ['present', 'array', 'max:4'],
                'items.*.name' => ['required', 'string', 'max:40'],
                'items.*.badge' => ['nullable', 'string', 'max:24'],
                'items.*.price' => ['required', 'string', 'max:20'],
                'items.*.period' => ['nullable', 'string', 'max:20'],
                'items.*.description' => ['nullable', 'string', 'max:200'],
                'items.*.features' => ['nullable', 'string', 'max:1000'],
                'items.*.button_label' => ['nullable', 'string', 'max:40'],
                'items.*.button_url' => ['nullable', 'string', 'max:500', self::safeUrl()],
            ],
            'faq' => [
                'title' => ['nullable', 'string', 'max:120'],
                'items' => ['present', 'array', 'max:10'],
                'items.*.question' => ['required', 'string', 'max:200'],
                'items.*.answer' => ['nullable', 'string', 'max:1000'],
            ],
            'cta' => [
                'title' => ['required', 'string', 'max:120'],
                'text' => ['nullable', 'string', 'max:300'],
                'button_label' => ['nullable', 'string', 'max:40'],
                'button_url' => ['nullable', 'string', 'max:500', self::safeUrl()],
            ],
            default => [],
        };
    }

    /**
     * Allows https and http links, and paths on this site such as /storage/landing/a.png.
     * Rejects javascript:, data:, and protocol-relative links (//example.com).
     */
    private static function safeUrl(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if ($value === null || $value === '') {
                return;
            }

            if (! is_string($value) || preg_match('#^(https?://[^\s]+|/(?!/)[^\s]*)$#i', $value) !== 1) {
                $fail(__('Use a full http or https link, or a path starting with /.'));
            }
        };
    }
}
