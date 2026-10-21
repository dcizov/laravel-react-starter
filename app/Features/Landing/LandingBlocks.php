<?php

namespace App\Features\Landing;

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
        'navbar', 'footer',
    ];

    public const MAX_BLOCKS = 40;

    // The page theme choices. Must match theme.ts on the client.
    /**
     * How many layouts each block type has. Mirrors VARIANT_NAMES in resources/js/components/landing/block-types.ts.
     *
     * @var array<string, int>
     */
    public const VARIANT_COUNTS = [
        'navbar' => 5, 'footer' => 5, 'hero' => 5, 'logos' => 5, 'features' => 5,
        'stats' => 5, 'testimonials' => 5, 'pricing' => 5, 'faq' => 5, 'cta' => 5,
        'text' => 5, 'image' => 4, 'button' => 4,
    ];

    public const FONTS = ['sans', 'serif', 'mono'];

    public const TEXT_SIZES = ['sm', 'md', 'lg'];

    // The icon keys a feature item may use. Must match FEATURE_ICONS in block-types.ts.
    public const FEATURE_ICONS = [
        'zap', 'shield', 'layers', 'users', 'chart', 'globe',
        'lock', 'sparkles', 'check', 'rocket', 'palette', 'settings',
    ];

    /**
     * The built-in page. Used until an admin publishes their own. See LandingPresets::starter().
     *
     * @return list<array{id: string, type: string, data: array<string, mixed>, style?: array<string, mixed>}>
     */
    public static function defaults(): array
    {
        return LandingPresets::starter();
    }

    /**
     * The built-in theme. Used until an admin publishes their own.
     *
     * @return array{primary: string, background: string, foreground: string, radius: float, font: string, text_size: string}
     */
    public static function defaultTheme(): array
    {
        return [
            'primary' => '#171717',
            'background' => '#ffffff',
            'foreground' => '#0a0a0a',
            'radius' => 0.625,
            'font' => 'sans',
            'text_size' => 'md',
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
            $rules["blocks.$index.style"] = ['nullable', 'array'];

            foreach (self::styleRules() as $field => $styleRules) {
                $rules["blocks.$index.style.$field"] = $styleRules;
            }

            if (is_string($type) && in_array($type, self::TYPES, true)) {
                foreach (self::fieldRules($type) as $field => $fieldRules) {
                    $rules["blocks.$index.data.$field"] = $fieldRules;
                }

                // Each type has its own layouts, so the variant is checked against that type's count.
                $rules["blocks.$index.style.variant"] = ['nullable', 'integer', 'between:0,'.(self::VARIANT_COUNTS[$type] - 1)];
            }
        }

        // Checked here rather than with 'distinct' alone, so every duplicate is reported on its own key.
        $seen = [];
        $duplicates = [];

        foreach ($blocks as $index => $block) {
            $id = is_array($block) ? ($block['id'] ?? null) : null;

            if (is_string($id) && $id !== '') {
                if (isset($seen[$id])) {
                    $duplicates["blocks.$index.id"] = [__('Each block needs its own id.')];
                }

                $seen[$id] = true;
            }
        }

        if ($duplicates !== []) {
            throw ValidationException::withMessages($duplicates);
        }

        $validated = Validator::make(['blocks' => $blocks], $rules)->validate()['blocks'];

        return array_values(array_map(function (array $block): array {
            $result = [
                'id' => $block['id'],
                'type' => $block['type'],
                'data' => $block['data'],
            ];

            if (array_key_exists('style', $block)) {
                $result['style'] = $block['style'] ?? [];
            }

            return $result;
        }, $validated));
    }

    /**
     * Checks the page theme from an admin. Only the colours, corner radius, font, and text size are kept.
     *
     * @return array{primary: string, background: string, foreground: string, radius: float, font: string, text_size: string}
     *
     * @throws ValidationException
     */
    public static function validateTheme(mixed $theme): array
    {
        if (! is_array($theme)) {
            throw ValidationException::withMessages(['theme' => __('The theme must be a list of settings.')]);
        }

        return Validator::make(['theme' => $theme], [
            'theme' => ['required', 'array'],
            'theme.primary' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.background' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.foreground' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'theme.radius' => ['required', 'numeric', 'between:0,1.5'],
            'theme.font' => ['required', Rule::in(self::FONTS)],
            'theme.text_size' => ['required', Rule::in(self::TEXT_SIZES)],
        ])->validate()['theme'];
    }

    /**
     * The settings a block can have: layout, colours, background, sizes, font, and animation.
     * Anything else in a block's style is dropped. A colour is #rrggbb, or empty for the default.
     *
     * @return array<string, list<mixed>>
     */
    public static function styleRules(): array
    {
        return [
            // 0 to 4. Each block type names its layouts in VARIANT_NAMES; an index a type does not have shows its default layout.
            'variant' => ['nullable', 'integer', 'between:0,4'],
            'bg_color' => ['nullable', 'string', 'regex:/^(#[0-9a-fA-F]{6})?$/'],
            'bg_image' => ['nullable', 'string', 'max:500', self::safeUrl()],
            'bg_overlay' => ['nullable', 'integer', 'between:0,80'],
            'text_color' => ['nullable', 'string', 'regex:/^(#[0-9a-fA-F]{6})?$/'],
            'padding' => ['nullable', Rule::in(['none', 'sm', 'md', 'lg', 'xl'])],
            'width' => ['nullable', Rule::in(['narrow', 'default', 'wide', 'full'])],
            'align' => ['nullable', Rule::in(['left', 'center'])],
            'heading_size' => ['nullable', Rule::in(['sm', 'md', 'lg', 'xl'])],
            'font' => ['nullable', Rule::in(['theme', 'serif', 'mono'])],
            'animation' => ['nullable', Rule::in(['none', 'fade-up', 'fade-in', 'zoom-in', 'slide-right'])],
            'text_effect' => ['nullable', Rule::in(['none', 'words'])],
        ];
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
            'navbar' => [
                'items' => ['present', 'array', 'max:6'],
                'items.*.label' => ['required', 'string', 'max:40'],
                'items.*.url' => ['required', 'string', 'max:500', self::safeUrl()],
                'button_label' => ['nullable', 'string', 'max:40'],
                'button_url' => ['nullable', 'string', 'max:500', self::safeUrl()],
            ],
            'footer' => [
                'text' => ['nullable', 'string', 'max:300'],
                'columns' => ['present', 'array', 'max:4'],
                'columns.*.title' => ['required', 'string', 'max:40'],
                'columns.*.links' => ['present', 'array', 'max:6'],
                'columns.*.links.*.label' => ['required', 'string', 'max:40'],
                'columns.*.links.*.url' => ['required', 'string', 'max:500', self::safeUrl()],
                'copyright' => ['nullable', 'string', 'max:160'],
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
     * Allows https and http links, paths on this site such as /storage/landing/a.png, and #anchors on the page.
     * Rejects javascript:, data:, and protocol-relative links (//example.com).
     */
    private static function safeUrl(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if ($value === null || $value === '') {
                return;
            }

            if (! is_string($value) || preg_match('#^(https?://[^\s]+|/(?!/)[^\s]*|\#[A-Za-z0-9_-]{0,80})$#i', $value) !== 1) {
                $fail(__('Use a full http or https link, or a path starting with /.'));
            }
        };
    }
}
