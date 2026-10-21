// Marketing sections for the landing page: logo row, statistics, testimonials, pricing, FAQ, and call to action.
// The layouts are adapted from the free Shadcn Space blocks (MIT licence, see THIRD-PARTY-NOTICES.md).
// Text is always plain text, so nothing an admin types can add markup.
import { Check, PlusIcon, Quote } from 'lucide-react';
import type {
    BlockData,
    FaqItem,
    LogoItem,
    PricingItem,
    StatItem,
    TestimonialItem,
} from '@/components/landing/block-types';
import { LinkButton } from '@/components/landing/link-button';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function SectionTitle({ title }: { title?: string }) {
    return title ? (
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
        </h2>
    ) : null;
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

export function LogosBlock({ data }: { data: BlockData['logos'] }) {
    return (
        <section className="flex flex-col gap-6 py-12">
            {data.title && (
                <p className="text-center text-sm font-medium tracking-widest text-muted-foreground uppercase">
                    {data.title}
                </p>
            )}
            <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3 lg:grid-cols-6">
                {data.items.map((item: LogoItem, index: number) => (
                    <li
                        // Logo names have no id in the saved data, so the position is the key.
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                        className="flex items-center justify-center bg-background px-6 py-7 text-lg font-semibold tracking-tight text-muted-foreground transition-colors hover:text-foreground"
                    >
                        {item.name}
                    </li>
                ))}
            </ul>
        </section>
    );
}

export function StatsBlock({ data }: { data: BlockData['stats'] }) {
    return (
        <section className="flex flex-col gap-8 py-12">
            <SectionTitle title={data.title} />
            <div className="grid divide-y overflow-hidden rounded-2xl border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {data.items.map((item: StatItem, index: number) => (
                    <div
                        // Statistics have no id in the saved data, so the position is the key.
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                        className="flex flex-col items-center gap-2 p-8 text-center"
                    >
                        <p className="bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-5xl font-semibold tracking-tight text-transparent">
                            {item.value}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {item.label}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function TestimonialsBlock({
    data,
}: {
    data: BlockData['testimonials'];
}) {
    return (
        <section className="flex flex-col gap-8 py-12">
            <SectionTitle title={data.title} />
            <div className="grid gap-4 md:grid-cols-2">
                {data.items.map((item: TestimonialItem, index: number) => (
                    <div
                        // Testimonials have no id in the saved data, so the position is the key.
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                        className="flex flex-col justify-between gap-8 rounded-2xl border bg-card p-8"
                    >
                        <div className="flex flex-col gap-4">
                            <Quote
                                className="size-8 text-primary/30"
                                aria-hidden="true"
                            />
                            <p className="text-lg leading-relaxed">
                                {item.quote}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {initials(item.name)}
                            </div>
                            <div>
                                <p className="font-medium">{item.name}</p>
                                {item.role && (
                                    <p className="text-sm text-muted-foreground">
                                        {item.role}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function PricingBlock({ data }: { data: BlockData['pricing'] }) {
    return (
        <section className="flex flex-col gap-8 py-12">
            <SectionTitle title={data.title} />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.items.map((plan: PricingItem, index: number) => {
                    // A plan with a badge is the one to highlight.
                    const highlighted = Boolean(plan.badge);
                    const features = (plan.features ?? '')
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean);

                    return (
                        <div
                            // Plans have no id in the saved data, so the position is the key.
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className={cn(
                                'relative flex flex-col gap-6 rounded-2xl bg-card p-8',
                                highlighted
                                    ? 'border-primary shadow-xl ring-1 ring-primary/40'
                                    : 'border',
                            )}
                        >
                            {plan.badge && (
                                <Badge className="absolute -top-3 left-8">
                                    {plan.badge}
                                </Badge>
                            )}
                            <div className="flex flex-col gap-1">
                                <h3 className="text-lg font-medium">
                                    {plan.name}
                                </h3>
                                {plan.description && (
                                    <p className="text-sm text-muted-foreground">
                                        {plan.description}
                                    </p>
                                )}
                            </div>
                            <p className="flex items-end gap-1">
                                <span className="text-5xl font-semibold tracking-tight">
                                    {plan.price}
                                </span>
                                {plan.period && (
                                    <span className="pb-1 text-muted-foreground">
                                        {plan.period}
                                    </span>
                                )}
                            </p>
                            {features.length > 0 && (
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
                            )}
                            {plan.button_label && plan.button_url && (
                                <div className="mt-auto pt-2">
                                    <LinkButton
                                        className="w-full"
                                        variant={
                                            highlighted ? 'default' : 'outline'
                                        }
                                        href={plan.button_url}
                                        label={plan.button_label}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export function FaqBlock({ data }: { data: BlockData['faq'] }) {
    return (
        <section className="flex flex-col gap-8 py-12">
            <SectionTitle title={data.title} />
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
        </section>
    );
}

export function CtaBlock({ data }: { data: BlockData['cta'] }) {
    return (
        <section className="py-12">
            <div className="relative isolate flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 left-1/2 -z-10 size-96 -translate-x-1/2 rounded-full bg-primary-foreground/10 blur-3xl"
                />
                <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                    {data.title}
                </h2>
                {data.text && (
                    <p className="max-w-xl text-pretty text-primary-foreground/80">
                        {data.text}
                    </p>
                )}
                {data.button_label && data.button_url && (
                    <LinkButton
                        size="lg"
                        variant="secondary"
                        href={data.button_url}
                        label={data.button_label}
                    />
                )}
            </div>
        </section>
    );
}
