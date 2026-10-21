import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    alignClass,
    PADDING_CLASSES,
    sectionStyle,
    TITLE_HERO,
    TITLE_SECTION,
    WIDTH_CLASSES,
} from '@/components/landing/block-style';
import type {
    LandingBlock,
    ResolvedStyle,
} from '@/components/landing/block-types';
import { FEATURE_ICONS, resolveStyle } from '@/components/landing/block-types';
import {
    EditableText,
    Reveal,
    TextEffectContext,
} from '@/components/landing/landing-edit';
import { LinkButton } from '@/components/landing/link-button';
import {
    FaqBlock,
    LogosBlock,
    PricingBlock,
    StatsBlock,
    TestimonialsBlock,
} from '@/components/landing/marketing-blocks';
import { FooterBlock, NavbarBlock } from '@/components/landing/site-blocks';
import { cn } from '@/lib/utils';

// Draws one block. Used on the public page, the preview, and the editor canvas, so they always match.
// Text is rendered as plain text. There is no HTML from the admin.

// Every block sits in a full-width section, which takes the background and the entrance animation.
// Its content is kept to the chosen width and padding.
// The id is the block type, so a navbar link such as "#features" scrolls to the features block.
export function BlockFrame({
    style,
    id,
    sticky = false,
    children,
}: {
    style: ResolvedStyle;
    id?: string;
    sticky?: boolean;
    children: ReactNode;
}) {
    return (
        <Reveal
            animation={style.animation}
            className={cn('w-full', sticky && 'sticky top-0 z-50')}
        >
            <section
                id={id}
                className={cn(
                    'relative w-full scroll-mt-16',
                    // A sticky bar lets its mobile panel hang below it, so it is not clipped.
                    sticky
                        ? 'overflow-visible border-b bg-background/75 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/60'
                        : 'overflow-hidden',
                )}
                style={sectionStyle(style)}
            >
                <TextEffectContext value={style.text_effect}>
                    <div
                        className={cn(
                            'mx-auto flex w-full flex-col gap-8 px-4 md:px-8',
                            WIDTH_CLASSES[style.width],
                            PADDING_CLASSES[style.padding],
                            alignClass(style.align),
                        )}
                    >
                        {children}
                    </div>
                </TextEffectContext>
            </section>
        </Reveal>
    );
}

export function RenderBlock({ block }: { block: LandingBlock }) {
    const style = resolveStyle(block);

    // The navigation bar is always a full-width, fixed-height strip that sticks to the top.
    // It does not animate in, because it has to be there from the first frame.
    if (block.type === 'navbar') {
        return (
            <BlockFrame
                style={{
                    ...style,
                    padding: 'none',
                    width: 'full',
                    animation: 'none',
                }}
                id={block.type}
                sticky
            >
                {renderContent(block, style)}
            </BlockFrame>
        );
    }

    return (
        <BlockFrame style={style} id={block.type}>
            {renderContent(block, style)}
        </BlockFrame>
    );
}

function renderContent(block: LandingBlock, style: ResolvedStyle): ReactNode {
    const centered = style.align === 'center';

    switch (block.type) {
        case 'hero': {
            const { data } = block;
            const actions =
                data.button_label && data.button_url ? (
                    <LinkButton
                        size="lg"
                        href={data.button_url}
                        labelPath="button_label"
                        label={data.button_label}
                    />
                ) : null;
            const copy = (
                <>
                    <EditableText
                        as="h2"
                        path="title"
                        value={data.title}
                        required
                        max={120}
                        className={TITLE_HERO}
                    />
                    <EditableText
                        as="p"
                        path="text"
                        value={data.text}
                        multiline
                        max={300}
                        className="max-w-2xl text-lg text-pretty text-muted-foreground"
                    />
                    {actions}
                </>
            );

            if (style.variant === 1) {
                return (
                    <div className="grid w-full items-center gap-10 md:grid-cols-2">
                        <div
                            className={cn(
                                'flex flex-col gap-6',
                                centered
                                    ? 'items-center text-center'
                                    : 'items-start text-left',
                            )}
                        >
                            {copy}
                        </div>
                        {data.image ? (
                            <img
                                src={data.image}
                                alt=""
                                className="w-full rounded-2xl border object-cover shadow-xl"
                            />
                        ) : (
                            <div
                                aria-hidden="true"
                                className="aspect-4/3 w-full rounded-2xl border bg-muted"
                            />
                        )}
                    </div>
                );
            }

            if (style.variant === 2) {
                return (
                    <div className="grid w-full gap-10 border-t pt-10 text-left md:grid-cols-[1.4fr_1fr] md:items-end">
                        <div className="flex flex-col items-start gap-6">
                            <EditableText
                                as="h2"
                                path="title"
                                value={data.title}
                                required
                                max={120}
                                className={TITLE_HERO}
                            />
                        </div>
                        <div className="flex flex-col items-start gap-6">
                            <EditableText
                                as="p"
                                path="text"
                                value={data.text}
                                multiline
                                max={300}
                                className="text-lg text-pretty text-muted-foreground"
                            />
                            {actions}
                        </div>
                        {data.image && (
                            <img
                                src={data.image}
                                alt=""
                                className="w-full rounded-2xl border object-cover md:col-span-2"
                            />
                        )}
                    </div>
                );
            }

            return (
                <div className="relative isolate w-full overflow-hidden rounded-3xl border bg-card px-6 py-16 text-center sm:px-12 sm:py-24">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-24 -bottom-32 -z-10 size-96 rounded-full bg-primary/10 blur-3xl"
                    />
                    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
                        {copy}
                    </div>
                    {data.image && (
                        <img
                            src={data.image}
                            alt=""
                            className="mx-auto mt-14 w-full max-w-4xl rounded-2xl border object-cover shadow-2xl"
                        />
                    )}
                </div>
            );
        }

        case 'logos':
            return <LogosBlock data={block.data} variant={style.variant} />;

        case 'features':
            return (
                <FeaturesBlock
                    data={block.data}
                    variant={style.variant}
                    centered={centered}
                />
            );

        case 'text':
            return (
                <TextBlock
                    data={block.data}
                    variant={style.variant}
                    centered={centered}
                />
            );

        case 'image':
            return block.data.src ? (
                <figure
                    className={cn(
                        'w-full',
                        style.variant === 1 && '-mx-4 md:-mx-8',
                    )}
                >
                    <img
                        src={block.data.src}
                        alt={block.data.alt}
                        className={cn(
                            'mx-auto w-full object-cover',
                            style.variant === 1
                                ? 'rounded-none border-y'
                                : 'max-w-4xl rounded-2xl border shadow-sm',
                        )}
                    />
                </figure>
            ) : null;

        case 'stats':
            return <StatsBlock data={block.data} variant={style.variant} />;

        case 'testimonials':
            return (
                <TestimonialsBlock data={block.data} variant={style.variant} />
            );

        case 'pricing':
            return <PricingBlock data={block.data} variant={style.variant} />;

        case 'faq':
            return <FaqBlock data={block.data} variant={style.variant} />;

        case 'cta':
            return <CtaBlock data={block.data} variant={style.variant} />;

        case 'navbar':
            return <NavbarBlock data={block.data} variant={style.variant} />;

        case 'footer':
            return <FooterBlock data={block.data} variant={style.variant} />;

        case 'button':
            return block.data.label && block.data.url ? (
                <div
                    className={cn(
                        'flex',
                        style.variant === 1
                            ? 'justify-start'
                            : 'justify-center',
                    )}
                >
                    <LinkButton
                        size="lg"
                        href={block.data.url}
                        labelPath="label"
                        label={block.data.label}
                    />
                </div>
            ) : null;
    }
}

function FeaturesBlock({
    data,
    variant,
    centered,
}: {
    data: Extract<LandingBlock, { type: 'features' }>['data'];
    variant: number;
    centered: boolean;
}) {
    const title = (
        <EditableText
            as="h2"
            path="title"
            value={data.title}
            max={120}
            className={cn(TITLE_SECTION, 'w-full')}
        />
    );

    const icon = (index: number, className: string) => {
        const item = data.items[index];
        const Icon =
            FEATURE_ICONS[item?.icon ?? ''] ??
            FEATURE_ICONS.sparkles ??
            Sparkles;

        return <Icon className={className} aria-hidden="true" />;
    };

    // Feature items have no id in the saved data, so the position is the path and the key.
    if (variant === 1) {
        return (
            <div className="flex w-full flex-col gap-10">
                {title}
                <ul className="flex w-full flex-col divide-y rounded-2xl border bg-card">
                    {data.items.map((item, index) => (
                        <li
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="flex items-start gap-5 p-6 text-left"
                        >
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                {icon(index, 'size-5')}
                            </div>
                            <div className="flex flex-col gap-1">
                                <EditableText
                                    as="h3"
                                    path={`items.${index}.title`}
                                    value={item.title}
                                    required
                                    max={80}
                                    className="font-medium"
                                />
                                <EditableText
                                    as="p"
                                    path={`items.${index}.text`}
                                    value={item.text}
                                    multiline
                                    max={200}
                                    className="text-sm text-muted-foreground"
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    if (variant === 2) {
        return (
            <div className="flex w-full flex-col gap-10">
                {title}
                <div className="grid w-full gap-10 md:grid-cols-3">
                    {data.items.map((item, index) => (
                        <div
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className={cn(
                                'flex flex-col gap-4 border-t-2 border-primary pt-6 text-left',
                            )}
                        >
                            {icon(index, 'size-6 text-primary')}
                            <EditableText
                                as="h3"
                                path={`items.${index}.title`}
                                value={item.title}
                                required
                                max={80}
                                className="text-lg font-semibold"
                            />
                            <EditableText
                                as="p"
                                path={`items.${index}.text`}
                                value={item.text}
                                multiline
                                max={200}
                                className="text-sm text-muted-foreground"
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-10">
            {title}
            <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.items.map((item, index) => (
                    <div
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                        className={cn(
                            'flex flex-col gap-4 rounded-2xl border bg-card p-6 transition-colors hover:border-primary/40',
                            centered ? 'text-center' : 'text-left',
                        )}
                    >
                        <div
                            className={cn(
                                'flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary',
                                centered && 'mx-auto',
                            )}
                        >
                            {icon(index, 'size-5')}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <EditableText
                                as="h3"
                                path={`items.${index}.title`}
                                value={item.title}
                                required
                                max={80}
                                className="font-medium"
                            />
                            <EditableText
                                as="p"
                                path={`items.${index}.text`}
                                value={item.text}
                                multiline
                                max={200}
                                className="text-sm text-muted-foreground"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TextBlock({
    data,
    variant,
    centered,
}: {
    data: Extract<LandingBlock, { type: 'text' }>['data'];
    variant: number;
    centered: boolean;
}) {
    const heading = (
        <EditableText
            as="h2"
            path="heading"
            value={data.heading}
            max={120}
            className="text-2xl font-semibold tracking-tight"
        />
    );
    const body = (
        <EditableText
            as="p"
            path="body"
            value={data.body}
            multiline
            required
            max={2000}
            className="text-lg leading-relaxed whitespace-pre-line text-muted-foreground"
        />
    );

    if (variant === 1) {
        return (
            <div className="flex w-full max-w-2xl flex-col gap-4 border-l-4 border-primary pl-6 text-left">
                {heading}
                {body}
            </div>
        );
    }

    if (variant === 2) {
        return (
            <div className="grid w-full gap-8 text-left md:grid-cols-[1fr_1.4fr] md:items-start">
                {heading}
                {body}
            </div>
        );
    }

    return (
        <div
            className={cn(
                'mx-auto flex w-full max-w-2xl flex-col gap-4',
                centered ? 'text-center' : 'text-left',
            )}
        >
            {heading}
            {body}
        </div>
    );
}

function CtaBlock({
    data,
    variant,
}: {
    data: Extract<LandingBlock, { type: 'cta' }>['data'];
    variant: number;
}) {
    const button =
        data.button_label && data.button_url ? (
            <LinkButton
                size="lg"
                variant={variant === 0 ? 'secondary' : 'default'}
                href={data.button_url}
                labelPath="button_label"
                label={data.button_label}
            />
        ) : null;

    if (variant === 1) {
        return (
            <div className="flex w-full flex-col items-center gap-6 rounded-3xl border bg-card px-6 py-16 text-center sm:px-12">
                <EditableText
                    as="h2"
                    path="title"
                    value={data.title}
                    required
                    max={120}
                    className={TITLE_SECTION}
                />
                {data.text && (
                    <EditableText
                        as="p"
                        path="text"
                        value={data.text}
                        multiline
                        max={300}
                        className="max-w-xl text-pretty text-muted-foreground"
                    />
                )}
                {button}
            </div>
        );
    }

    if (variant === 2) {
        return (
            <div className="flex w-full flex-col items-start gap-6 rounded-3xl bg-muted p-8 text-left sm:flex-row sm:items-center sm:justify-between sm:p-12">
                <div className="flex flex-col gap-2">
                    <EditableText
                        as="h2"
                        path="title"
                        value={data.title}
                        required
                        max={120}
                        className="text-2xl font-semibold tracking-tight sm:text-3xl"
                    />
                    {data.text && (
                        <EditableText
                            as="p"
                            path="text"
                            value={data.text}
                            multiline
                            max={300}
                            className="text-muted-foreground"
                        />
                    )}
                </div>
                {button}
            </div>
        );
    }

    return (
        <div className="relative isolate flex w-full flex-col items-center gap-6 overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 -z-10 size-96 -translate-x-1/2 rounded-full bg-primary-foreground/10 blur-3xl"
            />
            <EditableText
                as="h2"
                path="title"
                value={data.title}
                required
                max={120}
                className={cn(TITLE_SECTION, 'max-w-2xl')}
            />
            {data.text && (
                <EditableText
                    as="p"
                    path="text"
                    value={data.text}
                    multiline
                    max={300}
                    className="max-w-xl text-pretty text-primary-foreground/80"
                />
            )}
            {button}
        </div>
    );
}
