<?php

namespace App\Features\Cms\Support;

use App\Features\Cms\Models\Cta;
use App\Support\Sites\CurrentSite;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * The content blocks of pages, posts and custom post types. Each block is {id, type, data}.
 *
 * Content is structured data, not HTML. The public site renders each type with its own component, so a visitor
 * never receives markup written by an admin. Keep the types here in step with resources/js/components/cms/content-blocks.tsx.
 */
final class ContentBlocks
{
    public const TYPES = ['heading', 'paragraph', 'quote', 'list', 'image', 'code', 'divider', 'cta'];

    public const MAX_BLOCKS = 200;

    /**
     * Checks every block and returns the cleaned list. Throws a validation error for the first problem.
     *
     * @return list<array{id: string, type: string, data: array<string, mixed>}>
     */
    public static function validate(mixed $blocks): array
    {
        if (! is_array($blocks) || ! array_is_list($blocks)) {
            throw ValidationException::withMessages(['body' => __('The content must be a list of blocks.')]);
        }

        if (count($blocks) > self::MAX_BLOCKS) {
            throw ValidationException::withMessages(['body' => __('A page can have at most :max blocks.', ['max' => self::MAX_BLOCKS])]);
        }

        $clean = [];

        foreach ($blocks as $index => $block) {
            $type = is_array($block) ? ($block['type'] ?? null) : null;

            if (! in_array($type, self::TYPES, true)) {
                throw ValidationException::withMessages(["body.$index" => __('Unknown block type.')]);
            }

            $data = is_array($block['data'] ?? null) ? $block['data'] : [];

            // Blank lines in a list are dropped rather than rejected, because the editor creates them while typing.
            if ($type === 'list' && is_array($data['items'] ?? null)) {
                $data['items'] = array_values(array_filter(
                    array_map(fn ($item) => is_string($item) ? trim($item) : $item, $data['items']),
                    fn ($item) => $item !== '',
                ));
            }

            $validator = Validator::make($data, self::rulesFor($type));

            if ($validator->fails()) {
                // Each error is keyed to its block and field (body.{index}.{field}), so the editor can show it under that block.
                $errors = [];

                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors["body.$index.$field"] = $messages[0];
                }

                throw ValidationException::withMessages($errors);
            }

            $validated = $validator->validated();

            // Rich text replaces the plain fields. The document is cleaned once here, so only whitelisted nodes are stored.
            if (is_array($validated['doc'] ?? null)) {
                $validated['doc'] = RichText::clean($validated['doc'], "body.$index.doc");
                unset($validated['text'], $validated['items']);
            }

            $clean[] = [
                'id' => is_string($block['id'] ?? null) && $block['id'] !== '' ? Str::limit($block['id'], 40, '') : Str::random(8),
                'type' => $type,
                'data' => $validated,
            ];
        }

        return $clean;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public static function rulesFor(string $type): array
    {
        return match ($type) {
            'heading' => [
                'level' => ['required', 'integer', 'in:2,3'],
                'text' => ['required', 'string', 'max:200'],
            ],
            // Paragraphs, quotes and lists are rich text (doc). Plain text (text, items) is still accepted for content
            // saved before the rich editor, and is shown as it was.
            'paragraph' => [
                'doc' => ['nullable', 'array'],
                'text' => ['required_without:doc', 'nullable', 'string', 'max:5000'],
            ],
            'quote' => [
                'doc' => ['nullable', 'array'],
                'text' => ['required_without:doc', 'nullable', 'string', 'max:1000'],
                'cite' => ['nullable', 'string', 'max:200'],
            ],
            'list' => [
                'ordered' => ['required', 'boolean'],
                'doc' => ['nullable', 'array'],
                'items' => ['required_without:doc', 'nullable', 'array', 'max:50'],
                'items.*' => ['required', 'string', 'max:500'],
            ],
            'image' => [
                'src' => ['required', 'string', 'max:500', SafeUrl::rule()],
                'alt' => ['nullable', 'string', 'max:200'],
                'caption' => ['nullable', 'string', 'max:300'],
            ],
            'code' => [
                'code' => ['required', 'string', 'max:5000'],
                'language' => ['nullable', 'string', 'max:30'],
            ],
            // A cta either points at a saved call to action, or carries its own text.
            'cta' => [
                'cta_id' => ['nullable', 'integer', Rule::exists('cms_ctas', 'id')->where('site_id', app(CurrentSite::class)->id())],
                'heading' => ['required_without:cta_id', 'nullable', 'string', 'max:160'],
                'text' => ['nullable', 'string', 'max:300'],
                'button_label' => ['nullable', 'string', 'max:40'],
                'button_url' => ['nullable', 'string', 'max:500', SafeUrl::rule()],
            ],
            default => [],
        };
    }

    /**
     * Replaces each cta block's id with the saved call to action, so the page can render it. A cta block whose
     * call to action was deleted is dropped rather than shown empty.
     *
     * @param  list<array{id: string, type: string, data: array<string, mixed>}>  $blocks
     * @return list<array{id: string, type: string, data: array<string, mixed>}>
     */
    public static function resolveCtas(array $blocks): array
    {
        $ids = collect($blocks)
            ->where('type', 'cta')
            ->pluck('data.cta_id')
            ->filter()
            ->unique()
            ->values();

        $ctas = $ids->isEmpty() ? collect() : Cta::query()->whereIn('id', $ids)->get()->keyBy('id');

        $resolved = [];

        foreach ($blocks as $block) {
            // Only a cta that points at a saved call to action is replaced. Everything else keeps its own content.
            if ($block['type'] !== 'cta' || empty($block['data']['cta_id'])) {
                $resolved[] = $block;

                continue;
            }

            $cta = $ctas->get($block['data']['cta_id']);

            if ($cta === null) {
                continue;
            }

            $resolved[] = [
                'id' => $block['id'],
                'type' => 'cta',
                'data' => [
                    'heading' => $cta->heading,
                    'text' => $cta->text,
                    'button_label' => $cta->button_label,
                    'button_url' => $cta->button_url,
                ],
            ];
        }

        return $resolved;
    }
}
