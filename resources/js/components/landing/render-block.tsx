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
    BlockData,
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
                    '@container relative w-full scroll-mt-16',
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
                            'mx-auto flex w-full flex-col gap-8 px-4 @2xl:px-8',
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

// The primary action of a block, shared by the hero, the call to action, and the text blocks.
function Actions({
    href,
    label,
    labelPath,
    inverse = false,
}: {
    href?: string;
    label?: string;
    labelPath: string;
    inverse?: boolean;
}) {
    if (!href || !label) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <LinkButton
                size="lg"
                href={href}
                label={label}
                labelPath={labelPath}
                variant={inverse ? 'secondary' : 'default'}
            />
        </div>
    );
}

// A soft glow behind the hero. It is decoration only and never blocks clicks.
function Backdrop() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 left-1/2 -z-10 size-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        />
    );
}

function renderContent(block: LandingBlock, style: ResolvedStyle): ReactNode {
    const centered = style.align === 'center';

    switch (block.type) {
        case 'hero':
            return (
                <HeroBlock
                    data={block.data}
                    variant={style.variant}
                    centered={centered}
                />
            );

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
                        style.variant === 1 && '-mx-4 @2xl:-mx-8',
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

// Hero: a headline, a short lead, the main action, and a product picture.
// Centered is the default. Split puts the picture beside the copy. Editorial sets the copy on a ruled grid.
function HeroBlock({
    data,
    variant,
    centered,
}: {
    data: BlockData['hero'];
    variant: number;
    centered: boolean;
}) {
    const lead = (
        <EditableText
            as="p"
            path="text"
            value={data.text}
            multiline
            max={300}
            className="max-w-2xl text-lg text-pretty text-muted-foreground @xl:text-xl"
        />
    );
    const title = (
        <EditableText
            as="h2"
            path="title"
            value={data.title}
            required
            max={120}
            className={TITLE_HERO}
        />
    );
    const actions = (
        <Actions
            href={data.button_url}
            label={data.button_label}
            labelPath="button_label"
        />
    );

    if (variant === 1) {
        // Split: copy on one side, the picture (or a frame where the picture will go) on the other.
        return (
            <div className="relative grid w-full items-center gap-10 @2xl:grid-cols-2">
                <div
                    className={cn(
                        'flex flex-col gap-6',
                        centered
                            ? 'items-center text-center @2xl:items-start @2xl:text-left'
                            : 'items-start text-left',
                    )}
                >
                    {title}
                    {lead}
                    {actions}
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
                        className="relative flex aspect-4/3 w-full items-end overflow-hidden rounded-2xl border bg-muted p-6"
                    >
                        <div className="grid w-full gap-3">
                            <span className="h-3 w-2/3 rounded-full bg-foreground/15" />
                            <span className="h-3 w-1/2 rounded-full bg-foreground/10" />
                            <span className="h-24 w-full rounded-xl border bg-background" />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (variant === 2) {
        // Editorial: a ruled top edge, the headline on the left, the lead and action on the right.
        return (
            <div className="relative grid w-full gap-8 border-t pt-10 @2xl:grid-cols-5">
                <div className="@2xl:col-span-3">{title}</div>
                <div className="flex flex-col items-start gap-6 @2xl:col-span-2 @2xl:pt-3">
                    {lead}
                    {actions}
                </div>
                {data.image && (
                    <img
                        src={data.image}
                        alt=""
                        className="col-span-full w-full rounded-2xl border object-cover"
                    />
                )}
            </div>
        );
    }

    // Centered: one column, the default for a product page.
    return (
        <div className="relative flex w-full flex-col items-center gap-6 py-6 text-center">
            <Backdrop />
            {title}
            {lead}
            {actions}
            {data.image && (
                <img
                    src={data.image}
                    alt=""
                    className="mt-6 w-full max-w-4xl rounded-2xl border object-cover shadow-2xl"
                />
            )}
        </div>
    );
}

// Features: each item has an icon, a title and a short line.
// Bento puts the first item in a wide tile. List is a numbered column. Columns is a plain grid.
function FeaturesBlock({
    data,
    variant,
    centered,
}: {
    data: BlockData['features'];
    variant: number;
    centered: boolean;
}) {
    const heading = (
        <EditableText
            as="h2"
            path="title"
            value={data.title}
            max={120}
            className={cn(
                TITLE_SECTION,
                centered ? 'text-center' : 'text-left',
            )}
        />
    );

    const icon = (icon: string | undefined) => {
        const Icon = (icon && FEATURE_ICONS[icon]) || Sparkles;

        return <Icon className="size-5" aria-hidden="true" />;
    };

    if (variant === 1) {
        // List: numbered rows separated by hairlines.
        return (
            <div className="flex w-full flex-col gap-10">
                {heading}
                <ol className="mx-auto flex w-full max-w-3xl flex-col divide-y">
                    {data.items.map((item, index) => (
                        <li
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="flex items-start gap-5 py-6"
                        >
                            <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <div className="flex flex-col gap-1">
                                <EditableText
                                    as="h3"
                                    path={`items.${index}.title`}
                                    value={item.title}
                                    required
                                    max={80}
                                    className="text-lg font-medium"
                                />
                                <EditableText
                                    as="p"
                                    path={`items.${index}.text`}
                                    value={item.text}
                                    multiline
                                    max={200}
                                    className="text-pretty text-muted-foreground"
                                />
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        );
    }

    if (variant === 2) {
        // Columns: no boxes, a hairline above each item and an icon in a square.
        return (
            <div className="flex w-full flex-col gap-10">
                {heading}
                <ul className="grid w-full gap-x-8 gap-y-10 @xl:grid-cols-2 @4xl:grid-cols-3">
                    {data.items.map((item, index) => (
                        <li
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="flex flex-col gap-4 border-t pt-6"
                        >
                            <span className="flex size-10 items-center justify-center rounded-lg border bg-background text-foreground">
                                {icon(item.icon)}
                            </span>
                            <EditableText
                                as="h3"
                                path={`items.${index}.title`}
                                value={item.title}
                                required
                                max={80}
                                className="text-lg font-medium"
                            />
                            <EditableText
                                as="p"
                                path={`items.${index}.text`}
                                value={item.text}
                                multiline
                                max={200}
                                className="text-pretty text-muted-foreground"
                            />
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    // Bento: the first feature is a wide tile, the rest are a grid of muted cards.
    return (
        <div className="flex w-full flex-col gap-10">
            {heading}
            <ul className="grid w-full gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
                {data.items.map((item, index) => (
                    <li
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                        className={cn(
                            'flex flex-col items-start gap-4 rounded-2xl border bg-card p-6 text-left',
                            bentoSpan(index, data.items.length),
                        )}
                    >
                        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            {icon(item.icon)}
                        </span>
                        <div className="flex flex-col gap-2">
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
                                className="text-pretty text-muted-foreground"
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// The bento grid is 2 columns on small screens and 3 on large ones. The first card is wide, and the last card
// stretches to fill its row, so no card is left alone on a row.
function bentoSpan(index: number, count: number): string {
    if (index === 0) {
        return '@xl:col-span-2 @4xl:col-span-2';
    }

    if (index !== count - 1 || count < 3) {
        return '';
    }

    const smLeft = (count - 1) % 2; // cards after the first, on the 2-column grid
    const lgLeft = (count - 2) % 3; // cards after the first row, on the 3-column grid
    const sm = smLeft === 1 ? '@xl:col-span-2' : '';
    const lg =
        lgLeft === 1
            ? '@4xl:col-span-3'
            : lgLeft === 2
              ? '@4xl:col-span-2'
              : '';

    return cn(sm, lg);
}

// Text: a heading and a body. The variants change the rhythm, not the words.
function TextBlock({
    data,
    variant,
    centered,
}: {
    data: BlockData['text'];
    variant: number;
    centered: boolean;
}) {
    if (variant === 1) {
        // Accent rule: a primary bar beside the copy, left aligned.
        return (
            <div className="grid w-full gap-6 border-l-4 border-primary pl-6 @2xl:pl-10">
                <EditableText
                    as="h2"
                    path="heading"
                    value={data.heading}
                    max={120}
                    className={cn(TITLE_SECTION, 'text-left')}
                />
                <EditableText
                    as="p"
                    path="body"
                    value={data.body}
                    multiline
                    required
                    max={2000}
                    className="max-w-3xl text-lg leading-relaxed text-pretty text-muted-foreground"
                />
            </div>
        );
    }

    if (variant === 2) {
        // Two columns: the heading on the left, the body on the right.
        return (
            <div className="grid w-full gap-6 @2xl:grid-cols-2 @2xl:gap-12">
                <EditableText
                    as="h2"
                    path="heading"
                    value={data.heading}
                    max={120}
                    className={cn(TITLE_SECTION, 'text-left')}
                />
                <EditableText
                    as="p"
                    path="body"
                    value={data.body}
                    multiline
                    required
                    max={2000}
                    className="text-lg leading-relaxed text-pretty text-muted-foreground"
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex w-full max-w-3xl flex-col gap-6',
                centered
                    ? 'mx-auto items-center text-center'
                    : 'items-start text-left',
            )}
        >
            <EditableText
                as="h2"
                path="heading"
                value={data.heading}
                max={120}
                className={TITLE_SECTION}
            />
            <EditableText
                as="p"
                path="body"
                value={data.body}
                multiline
                required
                max={2000}
                className="text-lg leading-relaxed text-pretty text-muted-foreground"
            />
        </div>
    );
}

// Call to action: a closing line and one action. Banner is a filled panel, Outline is a bordered card,
// Split puts the copy and the action side by side.
function CtaBlock({
    data,
    variant,
}: {
    data: BlockData['cta'];
    variant: number;
}) {
    if (variant === 2) {
        return (
            <div className="flex w-full flex-col items-start justify-between gap-6 rounded-3xl border bg-card p-8 @xl:p-12 @2xl:flex-row @2xl:items-center">
                <div className="flex max-w-xl flex-col gap-3">
                    <EditableText
                        as="h2"
                        path="title"
                        value={data.title}
                        required
                        max={120}
                        className="text-3xl font-medium tracking-tight text-balance @xl:text-4xl"
                    />
                    <EditableText
                        as="p"
                        path="text"
                        value={data.text}
                        multiline
                        max={300}
                        className="text-pretty text-muted-foreground"
                    />
                </div>
                <Actions
                    href={data.button_url}
                    label={data.button_label}
                    labelPath="button_label"
                />
            </div>
        );
    }

    if (variant === 1) {
        return (
            <div className="relative flex w-full flex-col items-center gap-6 rounded-3xl border bg-background px-6 py-16 text-center @xl:px-12">
                <EditableText
                    as="h2"
                    path="title"
                    value={data.title}
                    required
                    max={120}
                    className="max-w-2xl text-3xl font-medium tracking-tight text-balance @xl:text-4xl"
                />
                <EditableText
                    as="p"
                    path="text"
                    value={data.text}
                    multiline
                    max={300}
                    className="max-w-xl text-pretty text-muted-foreground"
                />
                <Actions
                    href={data.button_url}
                    label={data.button_label}
                    labelPath="button_label"
                />
            </div>
        );
    }

    // Banner: a filled panel with a soft highlight, the default closing block.
    return (
        <div className="relative isolate flex w-full flex-col items-center gap-6 overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground @xl:px-12">
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
                className="max-w-2xl text-3xl font-medium tracking-tight text-balance @xl:text-4xl"
            />
            <EditableText
                as="p"
                path="text"
                value={data.text}
                multiline
                max={300}
                className="max-w-xl text-pretty text-primary-foreground/80"
            />
            <Actions
                href={data.button_url}
                label={data.button_label}
                labelPath="button_label"
                inverse
            />
        </div>
    );
}
