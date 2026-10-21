<?php

namespace App\Features\Cms\Support;

use App\Features\Cms\Models\Cta;

/**
 * Lets blocks on other pages (the landing page) use a saved call to action. A cta block with a cta_id takes its
 * content from the library. A cta_id that no longer exists keeps the block's own content, so nothing disappears.
 */
final class CtaReference
{
    /**
     * @param  list<array{id: string, type: string, data: array<string, mixed>}>  $blocks
     * @return list<array{id: string, type: string, data: array<string, mixed>}>
     */
    public static function apply(array $blocks): array
    {
        $ids = collect($blocks)
            ->where('type', 'cta')
            ->pluck('data.cta_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return $blocks;
        }

        $ctas = Cta::query()->whereIn('id', $ids)->get()->keyBy('id');

        return array_map(function (array $block) use ($ctas) {
            if ($block['type'] !== 'cta' || ! isset($block['data']['cta_id'])) {
                return $block;
            }

            $cta = $ctas->get((int) $block['data']['cta_id']);

            if ($cta === null) {
                return $block;
            }

            $block['data'] = [
                ...$block['data'],
                'title' => $cta->heading,
                'text' => $cta->text ?? '',
                'button_label' => $cta->button_label ?? '',
                'button_url' => $cta->button_url ?? '',
            ];

            return $block;
        }, $blocks);
    }
}
