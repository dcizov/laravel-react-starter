import { ArrowRight, Layers, Shield, Sparkles, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SectionBlock, SectionContent } from '@/lib/sections';

import { bool, num, rows, str } from '@/lib/sections';
import { safeHref } from '@/lib/url';
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
export type SectionData = Record<string, unknown>;

export function SectionRenderer({
    block,
    className,
    data,
}: {
    block: SectionBlock;
    className?: string;
    data?: SectionData;
}) {
    if (!block.enabled) {
        return null;
    }

    return (
        <section
            className={cn('px-6 py-14 sm:py-20', className)}
            data-section={block.section}
        >
            <div className="mx-auto w-full max-w-5xl">
                {render(block.section, block.content, data)}
            </div>
        </section>
    );
}

function render(section: string, content: SectionContent, data?: SectionData) {
    switch (section) {
        case 'hero':
            return <Hero content={content} />;
        case 'rich-text':
            return <RichText content={content} />;
        case 'feature-grid':
            return <FeatureGrid content={content} />;
        case 'cta':
            return <Cta content={content} />;
        case 'stat-band':
            return <StatBand content={content} />;
        case 'blog-teaser':
            return <BlogTeaser content={content} data={data} />;
        default:
            return (
                <p className="text-sm text-muted-foreground">
                    Section “{section}” has no renderer.
                </p>
            );
    }
}

function Hero({ content }: { content: SectionContent }) {
    const align = str(content.align, 'center');
    const label = str(content.cta_label);
    const url = safeHref(str(content.cta_url));

    return (
        <div
            className={cn(
                'max-w-3xl space-y-5',
                align === 'center' ? 'mx-auto text-center' : '',
            )}
        >
            {str(content.eyebrow) ? (
                <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                    {str(content.eyebrow)}
                </p>
            ) : null}
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                {str(content.heading, 'Untitled hero')}
            </h1>
            {str(content.body) ? (
                <p className="text-lg text-balance text-muted-foreground">
                    {str(content.body)}
                </p>
            ) : null}
            {label && url ? (
                <a
                    href={url}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                >
                    {label}
                    <ArrowRight className="size-4" />
                </a>
            ) : null}
        </div>
    );
}

function RichText({ content }: { content: SectionContent }) {
    const width =
        str(content.width, 'narrow') === 'narrow' ? 'max-w-2xl' : 'max-w-4xl';
    const paragraphs = str(content.body)
        .split(/\n{2,}/)
        .filter(Boolean);

    return (
        <div className={cn('space-y-4', width)}>
            {str(content.heading) ? (
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {str(content.heading)}
                </h2>
            ) : null}
            {paragraphs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No content yet.</p>
            ) : (
                paragraphs.map((paragraph, index) => (
                    <p
                        key={paragraph.slice(0, 24) + String(index)}
                        className="leading-relaxed text-muted-foreground"
                    >
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
                        <p className="text-muted-foreground">
                            {str(content.intro)}
                        </p>
                    ) : null}
                </div>
            ) : null}

            {features.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No features yet.
                </p>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => {
                        const Icon =
                            featureIcons[str(feature.icon, 'sparkles')] ??
                            Sparkles;

                        return (
                            <div
                                key={str(feature.title) + String(index)}
                                className="rounded-lg border border-border bg-card p-5"
                            >
                                <Icon className="mb-3 size-5 text-primary" />
                                <h3 className="text-sm font-semibold">
                                    {str(feature.title)}
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
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
    const url = safeHref(str(content.button_url));

    return (
        <div
            className="rounded-xl px-6 py-10 text-center text-white sm:px-10"
            style={{
                backgroundColor: str(content.accent, 'oklch(0.51 0.19 264)'),
            }}
        >
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                {str(content.heading, 'Get in touch')}
            </h2>
            {str(content.body) ? (
                <p className="mx-auto mt-3 max-w-xl text-white/80">
                    {str(content.body)}
                </p>
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

type TeaserPost = {
    id: number;
    title: string;
    excerpt: string | null;
    url: string;
    date: string | null;
    category: string | null;
};

/**
 * PostCraft's teaser. The posts arrive as server-resolved section data, so this
 * component never fetches anything and keeps working with JS disabled.
 */
function BlogTeaser({
    content,
    data,
}: {
    content: SectionContent;
    data?: SectionData;
}) {
    const posts = Array.isArray(data?.posts)
        ? (data.posts as TeaserPost[])
        : [];
    const blogUrl =
        typeof data?.blog_url === 'string' ? data.blog_url : '/blog';

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-2xl space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        {str(content.heading, 'From the journal')}
                    </h2>
                    {str(content.intro) ? (
                        <p className="text-muted-foreground">
                            {str(content.intro)}
                        </p>
                    ) : null}
                </div>
                <a
                    href={blogUrl}
                    className="text-sm font-medium underline-offset-4 hover:underline"
                >
                    All posts
                </a>
            </div>

            {posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No posts published yet.
                </p>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                        <a
                            key={post.id}
                            href={post.url}
                            className="group rounded-lg border border-border p-5 transition-colors hover:border-primary/50"
                        >
                            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                                {post.category ?? 'Journal'} · {post.date ?? ''}
                            </p>
                            <h3 className="mt-2 text-sm font-semibold group-hover:underline">
                                {post.title}
                            </h3>
                            {post.excerpt ? (
                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                    {post.excerpt}
                                </p>
                            ) : null}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Theme section: figures with an editorial intro. Declared by the Aperture
 * theme's provider, so it is editable and validatable like any core section.
 */
function StatBand({ content }: { content: SectionContent }) {
    const stats = rows(content.stats);

    return (
        <div className="space-y-8">
            <div className="max-w-2xl space-y-2">
                {str(content.heading) ? (
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        {str(content.heading)}
                    </h2>
                ) : null}
                {str(content.intro) ? (
                    <p className="text-muted-foreground">
                        {str(content.intro)}
                    </p>
                ) : null}
            </div>

            {stats.length === 0 ? (
                <p className="text-sm text-muted-foreground">No figures yet.</p>
            ) : (
                <dl className="grid gap-6 sm:grid-cols-3">
                    {stats.map((stat, index) => (
                        <div
                            key={str(stat.label) + String(index)}
                            className="border-l-2 pl-4"
                            style={{
                                borderColor:
                                    'var(--theme-accent, var(--color-primary))',
                            }}
                        >
                            <dt className="order-2 text-xs tracking-wide text-muted-foreground uppercase">
                                {str(stat.label)}
                            </dt>
                            <dd className="text-3xl font-semibold tracking-tight">
                                {str(stat.value)}
                            </dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    );
}

export function SectionList({
    blocks,
    emptyLabel = 'This page has no sections yet.',
    data = {},
}: {
    blocks: SectionBlock[];
    emptyLabel?: string;
    data?: Record<string, SectionData>;
}) {
    if (blocks.length === 0) {
        return (
            <p className="px-6 py-16 text-center text-sm text-muted-foreground">
                {emptyLabel}
            </p>
        );
    }

    return (
        <>
            {blocks.map((block) => (
                <SectionRenderer
                    key={block.id}
                    block={block}
                    data={data[block.id]}
                />
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
