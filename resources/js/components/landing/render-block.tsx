import type { LandingBlock } from '@/components/landing/block-types';
import { Button } from '@/components/ui/button';

// Draws one block. Used on the public page, the preview, and the editor canvas, so they always match.
// Text is rendered as plain text. There is no HTML from the admin.
export function RenderBlock({ block }: { block: LandingBlock }) {
    switch (block.type) {
        case 'hero':
            return (
                <section className="flex flex-col items-center gap-4 py-10 text-center">
                    {block.data.image && (
                        <img
                            src={block.data.image}
                            alt=""
                            className="max-h-64 w-full max-w-2xl rounded-lg object-cover"
                        />
                    )}
                    <h2 className="text-3xl font-semibold tracking-tight">
                        {block.data.title}
                    </h2>
                    {block.data.text && (
                        <p className="max-w-xl text-muted-foreground">
                            {block.data.text}
                        </p>
                    )}
                    {block.data.button_label && block.data.button_url && (
                        <LinkButton
                            href={block.data.button_url}
                            label={block.data.button_label}
                        />
                    )}
                </section>
            );

        case 'features':
            return (
                <section className="flex flex-col gap-4 py-6">
                    {block.data.title && (
                        <h2 className="text-xl font-semibold">
                            {block.data.title}
                        </h2>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                        {block.data.items.map((item, index) => (
                            // Feature items have no id in the saved data, so the position is the key.
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            <div key={index} className="rounded-lg border p-4">
                                <h3 className="font-medium">{item.title}</h3>
                                {item.text && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {item.text}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            );

        case 'text':
            return (
                <section className="flex flex-col gap-2 py-6">
                    {block.data.heading && (
                        <h2 className="text-xl font-semibold">
                            {block.data.heading}
                        </h2>
                    )}
                    <p className="whitespace-pre-line text-muted-foreground">
                        {block.data.body}
                    </p>
                </section>
            );

        case 'image':
            return block.data.src ? (
                <figure className="py-6">
                    <img
                        src={block.data.src}
                        alt={block.data.alt}
                        className="mx-auto max-h-96 rounded-lg object-contain"
                    />
                </figure>
            ) : null;

        case 'button':
            return block.data.label && block.data.url ? (
                <div className="flex justify-center py-4">
                    <LinkButton
                        href={block.data.url}
                        label={block.data.label}
                    />
                </div>
            ) : null;
    }
}

// External links open in a new tab. Paths on this site stay in the tab.
function LinkButton({ href, label }: { href: string; label: string }) {
    const external = /^https?:\/\//i.test(href);

    return (
        <Button
            variant="outline"
            nativeButton={false}
            render={
                <a
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noreferrer' : undefined}
                />
            }
        >
            {label}
        </Button>
    );
}
