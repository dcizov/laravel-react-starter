import type { ReactNode } from 'react';
import type { RichDoc, RichMark, RichNode } from '@/components/cms/rich-text';

// Shows a stored document. It builds React elements from the tree, so no HTML is ever inserted as HTML, and a link
// that is not http, https, or a path on this site is shown as plain text.
export default function RichTextView({
    doc,
    className,
}: {
    doc: RichDoc;
    className?: string;
}) {
    return (
        <div className={className}>
            {(doc.content ?? []).map((node, index) => renderNode(node, index))}
        </div>
    );
}

function renderNode(node: RichNode, key: number): ReactNode {
    switch (node.type) {
        case 'text':
            return wrapMarks(node.text, node.marks ?? [], key);

        case 'hardBreak':
            return <br key={key} />;

        case 'paragraph':
            return (
                <p key={key} className="whitespace-pre-line">
                    {children(node.content)}
                </p>
            );

        case 'blockquote':
            return (
                <blockquote key={key} className="border-s-4 ps-4 italic">
                    {children(node.content)}
                </blockquote>
            );

        case 'bulletList':
            return (
                <ul key={key} className="list-disc space-y-1 ps-6">
                    {children(node.content)}
                </ul>
            );

        case 'orderedList':
            return (
                <ol key={key} className="list-decimal space-y-1 ps-6">
                    {children(node.content)}
                </ol>
            );

        case 'listItem':
            return <li key={key}>{children(node.content)}</li>;
    }
}

function children(nodes: RichNode[] | undefined): ReactNode[] {
    return (nodes ?? []).map((node, index) => renderNode(node, index));
}

// Marks wrap the text from the inside out, so bold italic text gets both.
function wrapMarks(text: string, marks: RichMark[], key: number): ReactNode {
    return marks.reduce<ReactNode>((inner, mark, index) => {
        switch (mark.type) {
            case 'bold':
                return <strong key={`${key}-${index}`}>{inner}</strong>;
            case 'italic':
                return <em key={`${key}-${index}`}>{inner}</em>;
            case 'link':
                return isSafeHref(mark.attrs.href) ? (
                    <a
                        key={`${key}-${index}`}
                        href={mark.attrs.href}
                        rel="noopener noreferrer nofollow"
                        className="underline underline-offset-4"
                    >
                        {inner}
                    </a>
                ) : (
                    inner
                );
        }
    }, text);
}

// The same rule as App\Features\Cms\Support\SafeUrl: https or http, or a path or anchor on this site.
function isSafeHref(href: string): boolean {
    return /^(https?:\/\/\S+|\/(?!\/)\S*|#[A-Za-z0-9_-]{0,80})$/i.test(href);
}
