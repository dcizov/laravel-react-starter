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
    public const TYPES = ['hero', 'features', 'text', 'image', 'button'];

    public const MAX_BLOCKS = 40;

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
                    'title' => "Let's get started",
                    'text' => 'Laravel has an incredibly rich ecosystem. We suggest starting with the following.',
                    'button_label' => 'Deploy now',
                    'button_url' => 'https://cloud.laravel.com',
                    'image' => '',
                ],
            ],
            [
                'id' => 'default-docs',
                'type' => 'button',
                'data' => ['label' => 'Read the documentation', 'url' => 'https://laravel.com/docs'],
            ],
            [
                'id' => 'default-laracasts',
                'type' => 'button',
                'data' => ['label' => 'Watch video tutorials at Laracasts', 'url' => 'https://laracasts.com'],
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
