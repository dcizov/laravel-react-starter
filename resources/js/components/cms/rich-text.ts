// The rich text of paragraph, quote and list blocks. The editor (Tiptap) stores a document tree. The server keeps
// only the node and mark types listed here (App\Features\Cms\Support\RichText), so the same list is used on both sides.

export type RichMark =
    | { type: 'bold' | 'italic' }
    | { type: 'link'; attrs: { href: string } };

export type RichNode =
    | { type: 'text'; text: string; marks?: RichMark[] }
    | { type: 'hardBreak' }
    | {
          type:
              | 'paragraph'
              | 'bulletList'
              | 'orderedList'
              | 'listItem'
              | 'blockquote';
          content?: RichNode[];
      };

export type RichDoc = { type: 'doc'; content?: RichNode[] };

export const EMPTY_DOC: RichDoc = {
    type: 'doc',
    content: [{ type: 'paragraph' }],
};

// The plain-text form saved before the rich editor existed. It is shown as paragraphs, so nothing is lost.
export function docFromLegacyText(text: string | null | undefined): RichDoc {
    const paragraphs = (text ?? '')
        .split(/\n{2,}/)
        .map((part) => part.trim())
        .filter((part) => part !== '')
        .map((part) => ({
            type: 'paragraph' as const,
            content: [{ type: 'text' as const, text: part }],
        }));

    return paragraphs.length > 0
        ? { type: 'doc', content: paragraphs }
        : EMPTY_DOC;
}

export function docFromLegacyItems(
    items: string[] | null | undefined,
): RichDoc {
    const list = (items ?? [])
        .filter((item) => item.trim() !== '')
        .map((item) => ({
            type: 'listItem' as const,
            content: [
                {
                    type: 'paragraph' as const,
                    content: [{ type: 'text' as const, text: item }],
                },
            ],
        }));

    return list.length > 0
        ? { type: 'doc', content: [{ type: 'bulletList', content: list }] }
        : EMPTY_DOC;
}

// Counts the characters of visible text, for the length limit shown in the editor.
export function docCharacters(doc: RichDoc): number {
    let count = 0;

    const visit = (node: RichNode | RichDoc) => {
        if (node.type === 'text') {
            count += node.text.length;
        }

        if ('content' in node && node.content) {
            node.content.forEach(visit);
        }
    };

    visit(doc);

    return count;
}
