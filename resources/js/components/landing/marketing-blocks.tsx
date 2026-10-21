// Logo strips, statistics, testimonials, pricing and FAQ for the landing page.
// The layouts follow common shadcn marketing blocks (see THIRD-PARTY-NOTICES.md): hairline-bordered
// grids, muted tiles, masonry quotes, highlighted plans and quiet FAQ rows. Every variant uses the same
// editable fields, so switching variant never loses content.
import { Check } from 'lucide-react';
import { use } from 'react';
import type {
    BlockData,
    FaqItem,
    PricingItem,
    StatItem,
    TestimonialItem,
} from '@/components/landing/block-types';
import {
    AnimatedNumber,
    EditableText,
    LandingEditContext,
} from '@/components/landing/landing-edit';
import { LinkButton } from '@/components/landing/link-button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Section heading. Editable in the editor, plain text on the public page.
function SectionTitle({
    path,
    value,
    className,
}: {
    path: string;
    value?: string;
    className?: string;
}) {
    return (
        <EditableText
            as="h2"
            path={path}
            value={value}
            max={120}
            className={cn(
                'text-center text-3xl font-medium tracking-tight text-balance @xl:text-4xl',
                className,
            )}
        />
    );
}

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

// Logo strip. Names stand in for logos, set in quiet type so they read as a row of partners.
export function LogosBlock({
    data,
    variant,
}: {
    data: BlockData['logos'];
    variant: number;
}) {
    const title = data.title !== undefined && (
        <EditableText
            as="p"
            path="title"
            value={data.title}
            max={120}
            className="text-center text-sm font-medium tracking-widest text-muted-foreground uppercase"
        />
    );

    if (variant === 1) {
        // A single row that scrolls sideways on narrow screens instead of wrapping into a tall block.
        return (
            <div className="flex w-full flex-col items-center gap-6">
                {title}
                <ul className="flex w-full [scrollbar-width:none] items-center gap-x-12 overflow-x-auto pb-2 text-lg font-semibold text-muted-foreground/80 @2xl:justify-center [&::-webkit-scrollbar]:hidden">
                    {data.items.map((item, index) => (
                        <li
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="shrink-0 whitespace-nowrap"
                        >
                            <EditableText
                                as="span"
                                path={`items.${index}.name`}
                                value={item.name}
                                required
                                max={60}
                            />
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    if (variant === 2) {
        // A ruled grid: every logo sits in its own cell, like a partner table.
        return (
            <div className="flex w-full flex-col items-center gap-6">
                {title}
                <ul className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border @xl:grid-cols-3 @4xl:grid-cols-6">
                    {data.items.map((item, index) => (
                        <li
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="flex min-h-20 items-center justify-center bg-background px-4 py-5 text-center text-base font-semibold text-muted-foreground"
                        >
                            <EditableText
                                as="span"
                                path={`items.${index}.name`}
                                value={item.name}
                                required
                                max={60}
                            />
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    // Default: a centred strip that wraps on small screens.
    return (
        <div className="flex w-full flex-col items-center gap-8">
            {title}
            <ul className="flex w-full flex-wrap items-center justify-center gap-x-10 gap-y-6 text-lg font-semibold text-muted-foreground/80">
                {data.items.map((item, index) => (
                    <li
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                    >
                        <EditableText
                            as="span"
                            path={`items.${index}.name`}
                            value={item.name}
                            required
                            max={60}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}

// The number animates into place on the public page. In the editor it is a plain, editable field.
function StatValue({
    path,
    value,
    className,
}: {
    path: string;
    value: string;
    className: string;
}) {
    const edit = use(LandingEditContext);

    if (edit) {
        return (
            <EditableText
                as="p"
                path={path}
                value={value}
                required
                max={20}
                className={className}
            />
        );
    }

    return <AnimatedNumber value={value} className={className} />;
}

export function StatsBlock({
    data,
    variant,
}: {
    data: BlockData['stats'];
    variant: number;
}) {
    const columns =
        data.items.length >= 4
            ? '@xl:grid-cols-2 @4xl:grid-cols-4'
            : '@xl:grid-cols-3';

    if (variant === 1) {
        // Plain: big figures separated by hairlines, no boxes.
        return (
            <div className="flex w-full flex-col gap-10">
                <SectionTitle path="title" value={data.title} />
                <dl
                    className={cn(
                        'grid w-full divide-y @xl:divide-x @xl:divide-y-0',
                        columns,
                    )}
                >
                    {data.items.map((item: StatItem, index: number) => (
                        <div
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="flex flex-col gap-2 px-6 py-8 text-center"
                        >
                            <dt className="order-2">
                                <EditableText
                                    as="span"
                                    path={`items.${index}.label`}
                                    value={item.label}
                                    required
                                    max={60}
                                    className="text-sm text-muted-foreground"
                                />
                            </dt>
                            <dd className="order-1 m-0">
                                <StatValue
                                    path={`items.${index}.value`}
                                    value={item.value}
                                    className="text-5xl font-semibold tracking-tight tabular-nums @xl:text-6xl"
                                />
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        );
    }

    if (variant === 2) {
        // Tiles: each figure sits on a muted panel, like a bento row.
        return (
            <div className="flex w-full flex-col gap-10">
                <SectionTitle path="title" value={data.title} />
                <dl className={cn('grid w-full gap-4', columns)}>
                    {data.items.map((item: StatItem, index: number) => (
                        <div
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="flex flex-col gap-3 rounded-2xl bg-muted p-6"
                        >
                            <dd className="m-0">
                                <StatValue
                                    path={`items.${index}.value`}
                                    value={item.value}
                                    className="text-4xl font-semibold tracking-tight tabular-nums @xl:text-5xl"
                                />
                            </dd>
                            <dt>
                                <EditableText
                                    as="span"
                                    path={`items.${index}.label`}
                                    value={item.label}
                                    required
                                    max={60}
                                    className="text-sm text-muted-foreground"
                                />
                            </dt>
                        </div>
                    ))}
                </dl>
            </div>
        );
    }

    // Cards: a bordered grid with a mono label, the common SaaS layout.
    return (
        <div className="flex w-full flex-col gap-10">
            <SectionTitle path="title" value={data.title} />
            <dl
                className={cn(
                    'grid w-full gap-px overflow-hidden rounded-2xl border bg-border',
                    columns,
                )}
            >
                {data.items.map((item: StatItem, index: number) => (
                    <div
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                        className="flex flex-col gap-3 bg-background p-8"
                    >
                        <dt>
                            <EditableText
                                as="span"
                                path={`items.${index}.label`}
                                value={item.label}
                                required
                                max={60}
                                className="font-mono text-xs tracking-wide text-muted-foreground uppercase"
                            />
                        </dt>
                        <dd className="m-0">
                            <StatValue
                                path={`items.${index}.value`}
                                value={item.value}
                                className="text-4xl font-semibold tracking-tight tabular-nums @xl:text-5xl"
                            />
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

// One quote with its author. Initials stand in for a photo, which the schema does not store.
function Quote({
    item,
    index,
    className,
    large = false,
}: {
    item: TestimonialItem;
    index: number;
    className?: string;
    large?: boolean;
}) {
    return (
        <figure
            className={cn(
                'flex flex-col justify-between gap-6 rounded-2xl border bg-card p-6',
                className,
            )}
        >
            <blockquote className="m-0">
                <EditableText
                    as="p"
                    path={`items.${index}.quote`}
                    value={item.quote}
                    multiline
                    required
                    max={400}
                    className={cn(
                        'text-pretty',
                        large
                            ? 'text-2xl font-medium tracking-tight @xl:text-3xl'
                            : 'text-base text-muted-foreground',
                    )}
                />
            </blockquote>
            <figcaption className="flex items-center gap-3">
                <Avatar className="size-10">
                    <AvatarFallback>{initials(item.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <EditableText
                        as="span"
                        path={`items.${index}.name`}
                        value={item.name}
                        required
                        max={80}
                        className="text-sm font-semibold"
                    />
                    <EditableText
                        as="span"
                        path={`items.${index}.role`}
                        value={item.role}
                        max={80}
                        className="text-sm text-muted-foreground"
                    />
                </div>
            </figcaption>
        </figure>
    );
}

export function TestimonialsBlock({
    data,
    variant,
}: {
    data: BlockData['testimonials'];
    variant: number;
}) {
    const title = <SectionTitle path="title" value={data.title} />;

    if (variant === 1 && data.items.length > 0) {
        // Featured: the first quote is large, the rest sit in a side list.
        const [first, ...rest] = data.items;

        return (
            <div className="flex w-full flex-col gap-10">
                {title}
                <div className="grid w-full gap-4 @4xl:grid-cols-3">
                    <Quote
                        item={first}
                        index={0}
                        large
                        className="@4xl:col-span-2"
                    />
                    <div className="flex flex-col gap-4">
                        {rest.map((item, offset) => (
                            <Quote
                                // eslint-disable-next-line @eslint-react/no-array-index-key
                                key={offset + 1}
                                item={item}
                                index={offset + 1}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 2) {
        // Wall: quotes flow into staggered columns, like a masonry board.
        return (
            <div className="flex w-full flex-col gap-10">
                {title}
                <div className="columns-1 gap-4 @2xl:columns-2 @4xl:columns-3">
                    {data.items.map((item, index) => (
                        <Quote
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            item={item}
                            index={index}
                            className="mb-4 break-inside-avoid"
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Pairs: two quotes per row.
    return (
        <div className="flex w-full flex-col gap-10">
            {title}
            <div className="grid w-full gap-4 @2xl:grid-cols-2">
                {data.items.map((item, index) => (
                    <Quote
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                        item={item}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
}

// The plan's features, one per line in the editor, shown as a checked list.
function PlanFeatures({ text }: { text?: string }) {
    const lines = (text ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) {
        return null;
    }

    return (
        <ul className="flex flex-col gap-3 text-sm">
            {lines.map((line, index) => (
                <li
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    key={index}
                    className="flex items-start gap-2.5"
                >
                    <Check
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                    />
                    <span>{line}</span>
                </li>
            ))}
        </ul>
    );
}

// One plan. A badge marks the recommended plan and lifts it with a ring.
function PlanCard({
    plan,
    index,
    className,
}: {
    plan: PricingItem;
    index: number;
    className?: string;
}) {
    const highlighted = plan.badge !== undefined && plan.badge !== '';

    return (
        <div
            className={cn(
                'relative flex flex-col gap-6 rounded-2xl border bg-card p-6',
                highlighted && 'ring-2 ring-primary',
                className,
            )}
        >
            {highlighted && (
                <Badge className="absolute -top-3 left-6">
                    <EditableText
                        as="span"
                        path={`items.${index}.badge`}
                        value={plan.badge}
                        max={24}
                    />
                </Badge>
            )}
            <div className="flex flex-col gap-2">
                <EditableText
                    as="h3"
                    path={`items.${index}.name`}
                    value={plan.name}
                    required
                    max={40}
                    className="text-lg font-semibold"
                />
                <EditableText
                    as="p"
                    path={`items.${index}.description`}
                    value={plan.description}
                    multiline
                    max={200}
                    className="text-sm text-muted-foreground"
                />
            </div>
            <div className="flex items-end gap-1">
                <EditableText
                    as="span"
                    path={`items.${index}.price`}
                    value={plan.price}
                    required
                    max={20}
                    className="text-5xl font-semibold tracking-tight"
                />
                {plan.period && (
                    <EditableText
                        as="span"
                        path={`items.${index}.period`}
                        value={plan.period}
                        max={20}
                        className="pb-1.5 text-sm text-muted-foreground"
                    />
                )}
            </div>
            {plan.button_label && plan.button_url && (
                <LinkButton
                    href={plan.button_url}
                    label={plan.button_label}
                    labelPath={`items.${index}.button_label`}
                    variant={highlighted ? 'default' : 'outline'}
                    className="w-full"
                />
            )}
            <PlanFeatures text={plan.features} />
        </div>
    );
}

export function PricingBlock({
    data,
    variant,
}: {
    data: BlockData['pricing'];
    variant: number;
}) {
    const title = <SectionTitle path="title" value={data.title} />;
    const count = data.items.length;
    const grid =
        count >= 4
            ? '@2xl:grid-cols-2 @5xl:grid-cols-4'
            : count === 2
              ? '@2xl:grid-cols-2'
              : '@2xl:grid-cols-3';

    if (variant === 1) {
        // Rows: each plan is a wide row with its price and button at the right.
        return (
            <div className="flex w-full flex-col gap-10">
                {title}
                <div className="flex w-full flex-col divide-y overflow-hidden rounded-2xl border bg-card">
                    {data.items.map((plan, index) => (
                        <div
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="flex flex-col gap-6 p-6 @2xl:flex-row @2xl:items-center @2xl:justify-between"
                        >
                            <div className="flex max-w-md flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <EditableText
                                        as="h3"
                                        path={`items.${index}.name`}
                                        value={plan.name}
                                        required
                                        max={40}
                                        className="text-lg font-semibold"
                                    />
                                    {plan.badge && (
                                        <Badge variant="secondary">
                                            {plan.badge}
                                        </Badge>
                                    )}
                                </div>
                                <EditableText
                                    as="p"
                                    path={`items.${index}.description`}
                                    value={plan.description}
                                    multiline
                                    max={200}
                                    className="text-sm text-muted-foreground"
                                />
                            </div>
                            <div className="flex items-center justify-between gap-6 @2xl:justify-end">
                                <div className="flex items-end gap-1">
                                    <EditableText
                                        as="span"
                                        path={`items.${index}.price`}
                                        value={plan.price}
                                        required
                                        max={20}
                                        className="text-4xl font-semibold tracking-tight"
                                    />
                                    {plan.period && (
                                        <EditableText
                                            as="span"
                                            path={`items.${index}.period`}
                                            value={plan.period}
                                            max={20}
                                            className="pb-1 text-sm text-muted-foreground"
                                        />
                                    )}
                                </div>
                                {plan.button_label && plan.button_url && (
                                    <LinkButton
                                        href={plan.button_url}
                                        label={plan.button_label}
                                        labelPath={`items.${index}.button_label`}
                                        variant={
                                            plan.badge ? 'default' : 'outline'
                                        }
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (variant === 2) {
        // Focus: the recommended plan is shown on its own, larger, with the rest beside it.
        const featured = data.items.findIndex((plan) => plan.badge);
        const focus = featured === -1 ? 0 : featured;

        return (
            <div className="flex w-full flex-col gap-10">
                {title}
                <div className="grid w-full items-start gap-4 @4xl:grid-cols-3">
                    {data.items.map((plan, index) => (
                        <PlanCard
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            plan={plan}
                            index={index}
                            className={
                                index === focus
                                    ? '@4xl:col-span-1 @4xl:-my-4 @4xl:py-10'
                                    : undefined
                            }
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Cards: the classic row of plans.
    return (
        <div className="flex w-full flex-col gap-10">
            {title}
            <div className={cn('grid w-full items-stretch gap-4', grid)}>
                {data.items.map((plan, index) => (
                    <PlanCard
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                        plan={plan}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
}

// One question. A native details element, so it works without script and stays keyboard friendly.
function FaqEntry({
    item,
    index,
    className,
}: {
    item: FaqItem;
    index: number;
    className?: string;
}) {
    const edit = use(LandingEditContext);

    return (
        <details
            className={cn('group', className)}
            open={edit ? true : undefined}
        >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left font-medium [&::-webkit-details-marker]:hidden">
                <EditableText
                    as="span"
                    path={`items.${index}.question`}
                    value={item.question}
                    required
                    max={200}
                    className="text-base"
                />
                <PlusGlyph />
            </summary>
            <EditableText
                as="p"
                path={`items.${index}.answer`}
                value={item.answer}
                multiline
                max={1000}
                className="mt-3 text-pretty text-muted-foreground"
            />
        </details>
    );
}

// A plus that turns into a minus while the answer is open.
function PlusGlyph() {
    return (
        <span
            aria-hidden="true"
            className="relative mt-1 size-4 shrink-0 text-muted-foreground"
        >
            <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current" />
            <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-current transition-transform group-open:scale-y-0" />
        </span>
    );
}

export function FaqBlock({
    data,
    variant,
}: {
    data: BlockData['faq'];
    variant: number;
}) {
    const title = <SectionTitle path="title" value={data.title} />;

    if (variant === 1) {
        // Open list: every answer is visible, separated by hairlines.
        return (
            <div className="flex w-full flex-col gap-8">
                {title}
                <dl className="mx-auto flex w-full max-w-3xl flex-col divide-y">
                    {data.items.map((item: FaqItem, index: number) => (
                        <div
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="flex flex-col gap-2 py-6"
                        >
                            <dt>
                                <EditableText
                                    as="span"
                                    path={`items.${index}.question`}
                                    value={item.question}
                                    required
                                    max={200}
                                    className="text-base font-medium"
                                />
                            </dt>
                            <dd className="m-0">
                                <EditableText
                                    as="p"
                                    path={`items.${index}.answer`}
                                    value={item.answer}
                                    multiline
                                    max={1000}
                                    className="text-pretty text-muted-foreground"
                                />
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        );
    }

    if (variant === 2) {
        // Two columns: questions on the left, a short prompt to ask more on the right.
        return (
            <div className="grid w-full gap-10 @4xl:grid-cols-[1fr_2fr]">
                <div className="flex flex-col gap-4">
                    <EditableText
                        as="h2"
                        path="title"
                        value={data.title}
                        max={120}
                        className="text-3xl font-medium tracking-tight text-balance @xl:text-4xl"
                    />
                </div>
                <div className="flex w-full flex-col divide-y">
                    {data.items.map((item: FaqItem, index: number) => (
                        <FaqEntry
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            item={item}
                            index={index}
                            className="py-5 first:pt-0"
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Accordion: quiet rows, one answer at a time is not enforced, so the reader can open several.
    return (
        <div className="flex w-full flex-col gap-8">
            {title}
            <div className="mx-auto flex w-full max-w-3xl flex-col divide-y rounded-2xl border bg-card px-6">
                {data.items.map((item: FaqItem, index: number) => (
                    <FaqEntry
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                        item={item}
                        index={index}
                        className="py-5"
                    />
                ))}
            </div>
        </div>
    );
}
