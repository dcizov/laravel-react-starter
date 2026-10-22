import { docCharacters } from '@/components/cms/rich-text';
import type { ContentBlock } from '@/types/cms';

// An average reader gets through about 200 words a minute, which is roughly 1,000 characters.
const CHARACTERS_PER_MINUTE = 1000;

// The minutes a post takes to read, at least one. Counts the text of the body, not the markup.
export function readingMinutes(body: ContentBlock[]): number {
    let characters = 0;

    for (const block of body) {
        switch (block.type) {
            case 'heading':
                characters += block.data.text.length;
                break;
            case 'paragraph':
            case 'quote':
                characters += block.data.doc
                    ? docCharacters(block.data.doc)
                    : (block.data.text ?? '').length;
                break;
            case 'list':
                characters += block.data.doc
                    ? docCharacters(block.data.doc)
                    : (block.data.items ?? []).join('').length;
                break;
            default:
                break;
        }
    }

    return Math.max(1, Math.round(characters / CHARACTERS_PER_MINUTE));
}
