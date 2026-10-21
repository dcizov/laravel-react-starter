// Marketing sections for the landing page: logo row, statistics, testimonials, pricing, and FAQ.
// Each one has three layouts, chosen by the block's variant. The layouts are written for this app;
// they follow common patterns in free shadcn landing templates and do not copy their code.
// Text is always plain text, so nothing an admin types can add markup.
import { Check, PlusIcon, Quote } from 'lucide-react';
import { TITLE_SECTION } from '@/components/landing/block-style';
import type {
    BlockData,
    FaqItem,
    LogoItem,
    PricingItem,
    StatItem,
    TestimonialItem,
} from '@/components/landing/block-types';
import { EditableText } from '@/components/landing/landing-edit';
import { LinkButton } from '@/components/landing/link-button';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function SectionTitle({ path, value }: { path: string; value?: string }) {
    return (
        <EditableText
            as="h2"
            path={path}
            value={value}
            max={120}
            className={cn(TITLE_SECTION, 'w-full text-center')}
        />
    );
}

// Two letters from the name, for the avatar circle.
function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? '')
        .join('');
}

// Lists have no id in the saved data, so the position is the key and the path.
export function LogosBlock({
    data,
    variant,
}: {
    data: BlockData['logos'];
    variant: number;
}) {
    const title = data.title ? (
        <EditableText
            as="p"
            path="title"
            value={data.title}
            max={120}
            className="text-center text-sm font-medium tracking-widest text-muted-foreground uppercase"
        />
    ) : null;

    if (variant === 1) {
        return (
            <div className="flex w-full flex-col items-center gap-6">
                {title}
                <ul className="flex w-full flex-wrap items-center justify-center gap-x-12 gap-y-6">
                    {data.items.map((item: LogoItem, index: number) => (
                        <li
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="text-xl font-semibold tracking-tight text-muted-foreground"
                        >
                            <EditableText
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
        return (
            <div className="flex w-full flex-col items-center gap-4">
                {title}
                <ul className="flex w-full flex-wrap divide-x border-y py-6">
                    {data.items.map((item: LogoItem, index: number) => (
                        <li
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="flex flex-1 basis-1/3 items-center justify-center px-4 py-3 text-base font-medium text-muted-foreground sm:basis-auto"
                        >
                            <EditableText
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

    return (
        <div className="flex w-full flex-col items-center gap-6">
            {title}
            <ul className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3 lg:grid-cols-6">
                {data.items.map((item: LogoItem, index: number) => (
                    <li
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                        className="flex items-center justify-center bg-background px-6 py-7 text-lg font-semibold tracking-tight text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <EditableText
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

export function StatsBlock({
    data,
    variant,
}: {
    data: BlockData['stats'];
    variant: number;
}) {
    const stat = (item: StatItem, index: number, className: string) => (
        <div
            key={index}
            className={cn(
                'flex flex-col items-center gap-2 p-8 text-center',
                className,
            )}
        >
            <EditableText
                as="p"
                path={`items.${index}.value`}
                value={item.value}
                required
                max={20}
                className="bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-5xl font-semibold tracking-tight text-transparent"
            />
            <EditableText
                as="p"
                path={`items.${index}.label`}
                value={item.label}
                required
                max={60}
                className="text-sm text-muted-foreground"
            />
        </div>
    );

    if (variant === 1) {
        return (
            <div className="flex w-full flex-col gap-8">
                <SectionTitle path="title" value={data.title} />
                <div className="grid w-full gap-8 sm:grid-cols-3">
                    {data.items.map((item, index) => stat(item, index, 'p-0'))}
                </div>
            </div>
        );
    }

    if (variant === 2) {
        return (
            <div className="flex w-full flex-col gap-8">
                <SectionTitle path="title" value={data.title} />
                <div className="grid w-full gap-4 sm:grid-cols-3">
                    {data.items.map((item, index) =>
                        stat(item, index, 'rounded-2xl bg-muted'),
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-8">
            <SectionTitle path="title" value={data.title} />
            <div className="grid w-full divide-y overflow-hidden rounded-2xl border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {data.items.map((item, index) => stat(item, index, ''))}
            </div>
        </div>
    );
}

export function TestimonialsBlock({
    data,
    variant,
}: {
    data: BlockData['testimonials'];
    variant: number;
}) {
    const card = (
        item: TestimonialItem,
        index: number,
        className: string,
        quoteClass: string,
    ) => (
        <div
            key={index}
            className={cn(
                'flex flex-col justify-between gap-8 rounded-2xl border bg-card p-8',
                className,
            )}
        >
            <div className="flex flex-col gap-4">
                <Quote className="size-8 text-primary/30" aria-hidden="true" />
                <EditableText
                    as="p"
                    path={`items.${index}.quote`}
                    value={item.quote}
                    multiline
                    required
                    max={400}
                    className={quoteClass}
                />
            </div>
            <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initials(item.name)}
                </div>
                <div>
                    <EditableText
                        as="p"
                        path={`items.${index}.name`}
                        value={item.name}
                        required
                        max={80}
                        className="font-medium"
                    />
                    {item.role && (
                        <EditableText
                            as="p"
                            path={`items.${index}.role`}
                            value={item.role}
                            max={80}
                            className="text-sm text-muted-foreground"
                        />
                    )}
                </div>
            </div>
        </div>
    );

    if (variant === 1 && data.items.length > 0) {
        const [featured, ...rest] = data.items;

        return (
            <div className="flex w-full flex-col gap-8">
                <SectionTitle path="title" value={data.title} />
                {featured &&
                    card(
                        featured,
                        0,
                        'mx-auto max-w-3xl items-center p-10 text-center',
                        'text-2xl leading-snug font-medium text-balance',
                    )}
                {rest.length > 0 && (
                    <div className="grid w-full gap-4 md:grid-cols-2">
                        {rest.map((item, index) =>
                            card(
                                item,
                                index + 1,
                                '',
                                'text-base leading-relaxed',
                            ),
                        )}
                    </div>
                )}
            </div>
        );
    }

    if (variant === 2) {
        return (
            <div className="flex w-full flex-col gap-8">
                <SectionTitle path="title" value={data.title} />
                <div className="columns-1 gap-4 md:columns-2">
                    {data.items.map((item, index) => (
                        <div
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="mb-4 break-inside-avoid"
                        >
                            {card(item, index, '', 'text-base leading-relaxed')}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-8">
            <SectionTitle path="title" value={data.title} />
            <div className="grid w-full gap-4 md:grid-cols-2">
                {data.items.map((item, index) =>
                    card(item, index, '', 'text-lg leading-relaxed'),
                )}
            </div>
        </div>
    );
}

function PlanFeatures({ text }: { text?: string }) {
    const features = (text ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    if (features.length === 0) {
        return null;
    }

    return (
        <ul className="flex flex-col gap-3 text-sm">
            {features.map((feature, featureIndex) => (
                <li
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    key={featureIndex}
                    className="flex items-start gap-3"
                >
                    <Check
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                    />
                    {feature}
                </li>
            ))}
        </ul>
    );
}

// One plan. The plan with a badge is the one to highlight.
function PlanCard({
    plan,
    index,
    large = false,
}: {
    plan: PricingItem;
    index: number;
    large?: boolean;
}) {
    const highlighted = Boolean(plan.badge);

    return (
        <div
            className={cn(
                'relative flex flex-col gap-6 rounded-2xl bg-card p-8',
                highlighted
                    ? 'border-primary shadow-xl ring-1 ring-primary/40'
                    : 'border',
                large && 'md:p-12',
            )}
        >
            {plan.badge && (
                <Badge className="absolute -top-3 left-8">
                    <EditableText
                        path={`items.${index}.badge`}
                        value={plan.badge}
                        max={24}
                    />
                </Badge>
            )}
            <div className="flex flex-col gap-1">
                <EditableText
                    as="h3"
                    path={`items.${index}.name`}
                    value={plan.name}
                    required
                    max={40}
                    className="text-lg font-medium"
                />
                {plan.description && (
                    <EditableText
                        as="p"
                        path={`items.${index}.description`}
                        value={plan.description}
                        max={200}
                        className="text-sm text-muted-foreground"
                    />
                )}
            </div>
            <p className="flex items-end gap-1">
                <EditableText
                    path={`items.${index}.price`}
                    value={plan.price}
                    required
                    max={20}
                    className={cn(
                        'font-semibold tracking-tight',
                        large ? 'text-6xl' : 'text-5xl',
                    )}
                />
                {plan.period && (
                    <EditableText
                        path={`items.${index}.period`}
                        value={plan.period}
                        max={20}
                        className="pb-1 text-muted-foreground"
                    />
                )}
            </p>
            <PlanFeatures text={plan.features} />
            {plan.button_label && plan.button_url && (
                <div className="mt-auto pt-2">
                    <LinkButton
                        className="w-full"
                        variant={highlighted ? 'default' : 'outline'}
                        href={plan.button_url}
                        label={plan.button_label}
                    />
                </div>
            )}
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
    if (variant === 1) {
        return (
            <div className="flex w-full flex-col gap-8">
                <SectionTitle path="title" value={data.title} />
                <div className="flex w-full flex-col divide-y rounded-2xl border bg-card">
                    {data.items.map((plan, index) => (
                        <div
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="flex flex-col gap-4 p-6 text-left md:flex-row md:items-center md:justify-between"
                        >
                            <div className="flex flex-col gap-1">
                                <EditableText
                                    as="h3"
                                    path={`items.${index}.name`}
                                    value={plan.name}
                                    required
                                    max={40}
                                    className="font-medium"
                                />
                                {plan.description && (
                                    <EditableText
                                        as="p"
                                        path={`items.${index}.description`}
                                        value={plan.description}
                                        max={200}
                                        className="text-sm text-muted-foreground"
                                    />
                                )}
                            </div>
                            <p className="flex items-end gap-1">
                                <EditableText
                                    path={`items.${index}.price`}
                                    value={plan.price}
                                    required
                                    max={20}
                                    className="text-3xl font-semibold tracking-tight"
                                />
                                {plan.period && (
                                    <EditableText
                                        path={`items.${index}.period`}
                                        value={plan.period}
                                        max={20}
                                        className="pb-0.5 text-sm text-muted-foreground"
                                    />
                                )}
                            </p>
                            {plan.button_label && plan.button_url && (
                                <LinkButton
                                    variant={plan.badge ? 'default' : 'outline'}
                                    href={plan.button_url}
                                    label={plan.button_label}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (variant === 2 && data.items.length > 0) {
        // The highlighted plan (or the first) is shown large, and the others sit in a row below it.
        const featuredIndex = Math.max(
            0,
            data.items.findIndex((plan) => Boolean(plan.badge)),
        );
        const featured = data.items[featuredIndex];
        const others = data.items.filter((_, index) => index !== featuredIndex);

        return (
            <div className="flex w-full flex-col gap-8">
                <SectionTitle path="title" value={data.title} />
                {featured && (
                    <div className="mx-auto w-full max-w-2xl">
                        <PlanCard plan={featured} index={featuredIndex} large />
                    </div>
                )}
                {others.length > 0 && (
                    <div className="grid w-full gap-4 md:grid-cols-3">
                        {data.items.map((plan, index) =>
                            index === featuredIndex ? null : (
                                <PlanCard
                                    // eslint-disable-next-line @eslint-react/no-array-index-key
                                    key={index}
                                    plan={plan}
                                    index={index}
                                />
                            ),
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-8">
            <SectionTitle path="title" value={data.title} />
            <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-3">
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

export function FaqBlock({
    data,
    variant,
}: {
    data: BlockData['faq'];
    variant: number;
}) {
    if (variant === 1) {
        return (
            <div className="flex w-full flex-col gap-8">
                <SectionTitle path="title" value={data.title} />
                <dl className="mx-auto flex w-full max-w-3xl flex-col divide-y">
                    {data.items.map((item: FaqItem, index: number) => (
                        <div
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="flex flex-col gap-2 py-6 text-left"
                        >
                            <EditableText
                                as="dt"
                                path={`items.${index}.question`}
                                value={item.question}
                                required
                                max={200}
                                className="text-base font-medium"
                            />
                            {item.answer && (
                                <EditableText
                                    as="dd"
                                    path={`items.${index}.answer`}
                                    value={item.answer}
                                    multiline
                                    max={1000}
                                    className="text-muted-foreground"
                                />
                            )}
                        </div>
                    ))}
                </dl>
            </div>
        );
    }

    if (variant === 2) {
        return (
            <div className="flex w-full flex-col gap-8">
                <SectionTitle path="title" value={data.title} />
                <div className="grid w-full gap-4 md:grid-cols-2">
                    {data.items.map((item: FaqItem, index: number) => (
                        <div
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="flex flex-col gap-3 rounded-2xl border bg-card p-6 text-left"
                        >
                            <EditableText
                                as="h3"
                                path={`items.${index}.question`}
                                value={item.question}
                                required
                                max={200}
                                className="font-medium"
                            />
                            {item.answer && (
                                <EditableText
                                    as="p"
                                    path={`items.${index}.answer`}
                                    value={item.answer}
                                    multiline
                                    max={1000}
                                    className="text-sm text-muted-foreground"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // The accordion keeps its questions as plain text: a text field cannot sit inside the accordion button.
    return (
        <div className="flex w-full flex-col gap-8">
            <SectionTitle path="title" value={data.title} />
            <Accordion className="mx-auto flex w-full max-w-3xl flex-col gap-3">
                {data.items.map((item: FaqItem, index: number) => (
                    <AccordionItem
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                        value={`item-${index}`}
                        className="rounded-2xl border bg-card px-5"
                    >
                        <AccordionTrigger className="py-4 text-left text-base font-medium hover:no-underline [&_svg[data-slot=accordion-trigger-icon]]:!hidden">
                            {item.question}
                            <PlusIcon className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-45" />
                        </AccordionTrigger>
                        {item.answer && (
                            <AccordionContent className="pb-4 text-muted-foreground">
                                {item.answer}
                            </AccordionContent>
                        )}
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
