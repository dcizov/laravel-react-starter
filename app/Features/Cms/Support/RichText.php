<?php

namespace App\Features\Cms\Support;

use Illuminate\Validation\ValidationException;

/**
 * Checks and cleans the rich text of paragraph, quote and list blocks. The editor (Tiptap) stores a document tree.
 * The public site renders the same tree with the same extensions, so it never receives markup from an admin.
 *
 * Only the nodes and marks listed here are kept. Anything else is dropped, and links must pass SafeUrl.
 */
final class RichText
{
    public const MAX_DEPTH = 12;

    public const MAX_CHARACTERS = 5000;

    /** @var list<string> */
    public const NODES = ['doc', 'paragraph', 'text', 'bulletList', 'orderedList', 'listItem', 'blockquote', 'hardBreak'];

    /** @var list<string> */
    public const MARKS = ['bold', 'italic', 'link'];

    /**
     * Returns the cleaned document. Throws a validation error keyed to $field when the document is not valid.
     *
     * @param  array<string, mixed>  $document
     * @return array<string, mixed>
     */
    public static function clean(array $document, string $field): array
    {
        $characters = 0;
        $clean = self::node($document, $field, 0, $characters);

        if (($clean['type'] ?? null) !== 'doc') {
            throw ValidationException::withMessages([$field => __('The text must be a document.')]);
        }

        if ($characters === 0) {
            throw ValidationException::withMessages([$field => __('The text cannot be empty.')]);
        }

        return $clean;
    }

    /**
     * The plain text of a document, for search, feeds, and the editor's length check.
     *
     * @param  array<string, mixed>  $node
     */
    public static function plainText(array $node): string
    {
        if (($node['type'] ?? null) === 'text') {
            return (string) ($node['text'] ?? '');
        }

        $parts = array_map(fn ($child) => is_array($child) ? self::plainText($child) : '', $node['content'] ?? []);

        return trim(implode(' ', array_filter($parts, fn ($part) => $part !== '')));
    }

    /**
     * @param  array<string, mixed>  $node
     * @return array<string, mixed>
     */
    private static function node(array $node, string $field, int $depth, int &$characters): array
    {
        if ($depth > self::MAX_DEPTH) {
            throw ValidationException::withMessages([$field => __('The text is nested too deeply.')]);
        }

        $type = $node['type'] ?? null;

        if (! is_string($type) || ! in_array($type, self::NODES, true)) {
            throw ValidationException::withMessages([$field => __('The text contains something that is not allowed.')]);
        }

        $clean = ['type' => $type];

        if ($type === 'text') {
            $text = $node['text'] ?? null;

            if (! is_string($text) || $text === '') {
                throw ValidationException::withMessages([$field => __('The text contains an empty piece.')]);
            }

            $characters += mb_strlen($text);

            if ($characters > self::MAX_CHARACTERS) {
                throw ValidationException::withMessages([$field => __('The text is too long.')]);
            }

            $clean['text'] = $text;

            $marks = self::marks($node['marks'] ?? [], $field);

            if ($marks !== []) {
                $clean['marks'] = $marks;
            }

            return $clean;
        }

        if (is_array($node['content'] ?? null)) {
            $clean['content'] = array_values(array_map(
                fn ($child) => is_array($child)
                    ? self::node($child, $field, $depth + 1, $characters)
                    : throw ValidationException::withMessages([$field => __('The text contains something that is not allowed.')]),
                $node['content'],
            ));
        }

        return $clean;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function marks(mixed $marks, string $field): array
    {
        if (! is_array($marks)) {
            return [];
        }

        $clean = [];

        foreach ($marks as $mark) {
            $type = is_array($mark) ? ($mark['type'] ?? null) : null;

            if (! is_string($type) || ! in_array($type, self::MARKS, true)) {
                continue;
            }

            if ($type !== 'link') {
                $clean[] = ['type' => $type];

                continue;
            }

            $href = $mark['attrs']['href'] ?? null;

            if (! is_string($href) || ! SafeUrl::isAllowed($href)) {
                throw ValidationException::withMessages([$field => __('Use a full http or https link, or a path starting with /.')]);
            }

            $clean[] = ['type' => 'link', 'attrs' => ['href' => $href]];
        }

        return $clean;
    }
}
