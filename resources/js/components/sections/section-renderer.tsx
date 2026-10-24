import { ArrowRight, Layers, Shield, Sparkles, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SectionBlock, SectionContent } from '@/lib/sections';
import { bool, num, rows, str } from '@/lib/sections';
import { cn } from '@/lib/utils';

const featureIcons: Record<string, LucideIcon> = {
    sparkles: Sparkles,
    layers: Layers,
    zap: Zap,
    shield: Shield,
};

/**
 * The plain core renderer. Themes replace this in a later step, but the markup
 * contract — one block in, one band of markup out — stays the same.
 */
export function SectionRenderer({
    block,
    className,
}: {
    block: SectionBlock;
    className?: string;
}) {
    if (!block.enabled) {
        return null;
    }

    return (
        <section className={cn('px-6 py-14 sm:py-20', className)} data-section={block.section}>
            <div className="mx-auto w-full max-w-5xl">{render(block.section, block.content)}</div>
        </section>
    );
}

function render(section: string, content: SectionContent) {
    switch (section) {
        case 'hero':
            return <Hero content={content} />;
        case 'rich-text':
            return <RichText content={content} />;
        case 'feature-grid':
            return <FeatureGrid content={content} />;
        case 'cta':
            return <Cta content={content} />;
        default:
            return (
                <p className="text-muted-foreground text-sm">
                    Section “{section}” has no renderer.
                </p>
            );
    }
}

function Hero({ content }: { content: SectionContent }) {
    const align = str(content.align, 'center');
    const label = str(content.cta_label);
    const url = str(content.cta_url);

    return (
        <div className={cn('max-w-3xl space-y-5', align === 'center' ? 'mx-auto text-center' : '')}>
            {str(content.eyebrow) ? (
                <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
                    {str(content.eyebrow)}
                </p>
            ) : null}
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                {str(content.heading, 'Untitled hero')}
            </h1>
            {str(content.body) ? (
                <p className="text-muted-foreground text-lg text-balance">{str(content.body)}</p>
            ) : null}
            {label && url ? (
                <a
                    href={url}
                    className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium"
                >
                    {label}
                    <ArrowRight className="size-4" />
                </a>
            ) : null}
        </div>
    );
}

function RichText({ content }: { content: SectionContent }) {
    const width = str(content.width, 'narrow') === 'narrow' ? 'max-w-2xl' : 'max-w-4xl';
    const paragraphs = str(content.body).split(/\n{2,}/).filter(Boolean);

    return (
        <div className={cn('space-y-4', width)}>
            {str(content.heading) ? (
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {str(content.heading)}
                </h2>
            ) : null}
            {paragraphs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No content yet.</p>
            ) : (
                paragraphs.map((paragraph, index) => (
                    <p key={paragraph.slice(0, 24) + String(index)} className="text-muted-foreground leading-relaxed">
                        {paragraph}
                    </p>
                ))
            )}
        </div>
    );
}

function FeatureGrid({ content }: { content: SectionContent }) {
    const features = rows(content.features);

    return (
        <div className="space-y-8">
            {str(content.heading) ? (
                <div className="max-w-2xl space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        {str(content.heading)}
                    </h2>
                    {str(content.intro) ? (
                        <p className="text-muted-foreground">{str(content.intro)}</p>
                    ) : null}
                </div>
            ) : null}

            {features.length === 0 ? (
                <p className="text-muted-foreground text-sm">No features yet.</p>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => {
                        const Icon = featureIcons[str(feature.icon, 'sparkles')] ?? Sparkles;

                        return (
                            <div
                                key={str(feature.title) + String(index)}
                                className="rounded-lg border border-border bg-card p-5"
                            >
                                <Icon className="text-primary mb-3 size-5" />
                                <h3 className="text-sm font-semibold">{str(feature.title)}</h3>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {str(feature.body)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function Cta({ content }: { content: SectionContent }) {
    const label = str(content.button_label);
    const url = str(content.button_url);

    return (
        <div
            className="rounded-xl px-6 py-10 text-center text-white sm:px-10"
            style={{ backgroundColor: str(content.accent, 'oklch(0.51 0.19 264)') }}
        >
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                {str(content.heading, 'Get in touch')}
            </h2>
            {str(content.body) ? (
                <p className="mx-auto mt-3 max-w-xl text-white/80">{str(content.body)}</p>
            ) : null}
            {label && url ? (
                <a
                    href={url}
                    className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-neutral-900"
                >
                    {label}
                    <ArrowRight className="size-4" />
                </a>
            ) : null}
        </div>
    );
}

export function SectionList({
    blocks,
    emptyLabel = 'This page has no sections yet.',
}: {
    blocks: SectionBlock[];
    emptyLabel?: string;
}) {
    if (blocks.length === 0) {
        return (
            <p className="text-muted-foreground px-6 py-16 text-center text-sm">{emptyLabel}</p>
        );
    }

    return (
        <>
            {blocks.map((block) => (
                <SectionRenderer key={block.id} block={block} />
            ))}
        </>
    );
}

export function plainText(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

export function featureCount(value: unknown): number {
    return rows(value).length;
}

export function numeric(value: unknown): number {
    return num(value);
}

export function isEnabled(value: unknown): boolean {
    return bool(value);
}
