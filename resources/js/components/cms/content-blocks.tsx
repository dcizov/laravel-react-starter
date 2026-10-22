import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ContentBlock } from '@/types/cms';

// Renders stored content blocks. Each type has its own markup, and text is always passed to React as text, so an
// admin cannot inject HTML or script. Keep the types in step with App\Features\Cms\Support\ContentBlocks.
export default function ContentBlocks({
    blocks,
    className,
}: {
    blocks: ContentBlock[];
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col gap-5 text-base leading-relaxed',
                className,
            )}
        >
            {blocks.map((block) => (
                <Block key={block.id} block={block} />
            ))}
        </div>
    );
}

function Block({ block }: { block: ContentBlock }) {
    switch (block.type) {
        case 'heading':
            return block.data.level === 2 ? (
                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                    {block.data.text}
                </h2>
            ) : (
                <h3 className="mt-2 text-xl font-semibold tracking-tight">
                    {block.data.text}
                </h3>
            );

        case 'paragraph':
            return <p className="whitespace-pre-line">{block.data.text}</p>;

        case 'quote':
            return (
                <figure className="border-s-4 ps-4 text-lg italic">
                    <blockquote>{block.data.text}</blockquote>
                    {block.data.cite && (
                        <figcaption className="mt-2 text-sm text-muted-foreground not-italic">
                            {block.data.cite}
                        </figcaption>
                    )}
                </figure>
            );

        case 'list': {
            // Static list: items are never reordered or edited here, so the position is a stable key.
            const items = block.data.items.map((item, index) => (
                // eslint-disable-next-line @eslint-react/no-array-index-key
                <li key={index}>{item}</li>
            ));

            return block.data.ordered ? (
                <ol className="list-decimal space-y-1 ps-6">{items}</ol>
            ) : (
                <ul className="list-disc space-y-1 ps-6">{items}</ul>
            );
        }

        case 'image':
            return (
                <figure className="flex flex-col gap-2">
                    <img
                        src={block.data.src}
                        alt={block.data.alt ?? ''}
                        loading="lazy"
                        className="w-full rounded-lg border object-cover"
                    />
                    {block.data.caption && (
                        <figcaption className="text-sm text-muted-foreground">
                            {block.data.caption}
                        </figcaption>
                    )}
                </figure>
            );

        case 'code':
            return (
                <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-sm">
                    <code data-language={block.data.language ?? undefined}>
                        {block.data.code}
                    </code>
                </pre>
            );

        case 'divider':
            return <hr className="border-border" />;

        case 'cta':
            return (
                <section className="flex flex-col items-start gap-3 rounded-xl border bg-muted/40 p-6">
                    {block.data.heading && (
                        <h2 className="text-xl font-semibold">
                            {block.data.heading}
                        </h2>
                    )}
                    {block.data.text && (
                        <p className="text-muted-foreground">
                            {block.data.text}
                        </p>
                    )}
                    {block.data.button_label && block.data.button_url && (
                        <Button
                            nativeButton={false}
                            render={
                                <a
                                    href={block.data.button_url}
                                    rel={
                                        block.data.button_url.startsWith('http')
                                            ? 'noopener noreferrer'
                                            : undefined
                                    }
                                />
                            }
                        >
                            {block.data.button_label}
                        </Button>
                    )}
                </section>
            );
    }
}
