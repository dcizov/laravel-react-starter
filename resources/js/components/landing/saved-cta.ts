import type { LandingBlock } from '@/components/landing/block-types';
import type { CtaOption } from '@/types/cms';

// Shows a cta block the way the public page will: when it points at a saved call to action, the saved text is used.
// A cta_id that no longer exists keeps the block's own text, matching App\Features\Cms\Support\CtaReference.
export function applySavedCta(
    block: LandingBlock,
    ctas: CtaOption[],
): LandingBlock {
    if (block.type !== 'cta' || !block.data.cta_id) {
        return block;
    }

    const cta = ctas.find((item) => item.id === block.data.cta_id);

    if (!cta) {
        return block;
    }

    return {
        ...block,
        data: {
            ...block.data,
            title: cta.heading,
            text: cta.text ?? '',
            button_label: cta.button_label ?? '',
            button_url: cta.button_url ?? '',
        },
    };
}
