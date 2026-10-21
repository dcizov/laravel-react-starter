import { Sparkles } from 'lucide-react';
import type { LandingBlock } from '@/components/landing/block-types';
import { FEATURE_ICONS } from '@/components/landing/block-types';
import { LinkButton } from '@/components/landing/link-button';
import {
    CtaBlock,
    FaqBlock,
    LogosBlock,
    PricingBlock,
    StatsBlock,
    TestimonialsBlock,
} from '@/components/landing/marketing-blocks';

// Draws one block. Used on the public page, the preview, and the editor canvas, so they always match.
// Text is rendered as plain text. There is no HTML from the admin.
export function RenderBlock({ block }: { block: LandingBlock }) {
    switch (block.type) {
        case 'hero':
            return (
                <section className="relative isolate overflow-hidden rounded-3xl border bg-card px-6 py-16 text-center sm:px-12 sm:py-24">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-24 -bottom-32 -z-10 size-96 rounded-full bg-primary/10 blur-3xl"
                    />
                    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
                        <h2 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                            {block.data.title}
                        </h2>
                        {block.data.text && (
                            <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
                                {block.data.text}
                            </p>
                        )}
                        {block.data.button_label && block.data.button_url && (
                            <LinkButton
                                size="lg"
                                href={block.data.button_url}
                                label={block.data.button_label}
                            />
                        )}
                    </div>
                    {block.data.image && (
                        <img
                            src={block.data.image}
                            alt=""
                            className="mx-auto mt-14 w-full max-w-4xl rounded-2xl border object-cover shadow-2xl"
                        />
                    )}
                </section>
            );

        case 'logos':
            return <LogosBlock data={block.data} />;

        case 'features':
            return (
                <section className="flex flex-col gap-10 py-12">
                    {block.data.title && (
                        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
                            {block.data.title}
                        </h2>
                    )}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {block.data.items.map((item, index) => {
                            const Icon =
                                FEATURE_ICONS[item.icon ?? ''] ??
                                FEATURE_ICONS.sparkles ??
                                Sparkles;

                            return (
                                <div
                                    // Feature items have no id in the saved data, so the position is the key.
                                    // eslint-disable-next-line @eslint-react/no-array-index-key
                                    key={index}
                                    className="flex flex-col gap-4 rounded-2xl border bg-card p-6 transition-colors hover:border-primary/40"
                                >
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Icon
                                            className="size-5"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <h3 className="font-medium">
                                            {item.title}
                                        </h3>
                                        {item.text && (
                                            <p className="text-sm text-muted-foreground">
                                                {item.text}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            );

        case 'text':
            return (
                <section className="mx-auto flex max-w-2xl flex-col gap-4 py-12">
                    {block.data.heading && (
                        <h2 className="text-2xl font-semibold tracking-tight">
                            {block.data.heading}
                        </h2>
                    )}
                    <p className="text-lg leading-relaxed whitespace-pre-line text-muted-foreground">
                        {block.data.body}
                    </p>
                </section>
            );

        case 'image':
            return block.data.src ? (
                <figure className="py-12">
                    <img
                        src={block.data.src}
                        alt={block.data.alt}
                        className="mx-auto w-full max-w-4xl rounded-2xl border object-cover shadow-sm"
                    />
                </figure>
            ) : null;

        case 'stats':
            return <StatsBlock data={block.data} />;

        case 'testimonials':
            return <TestimonialsBlock data={block.data} />;

        case 'pricing':
            return <PricingBlock data={block.data} />;

        case 'faq':
            return <FaqBlock data={block.data} />;

        case 'cta':
            return <CtaBlock data={block.data} />;

        case 'button':
            return block.data.label && block.data.url ? (
                <div className="flex justify-center py-12">
                    <LinkButton
                        size="lg"
                        href={block.data.url}
                        label={block.data.label}
                    />
                </div>
            ) : null;
    }
}
