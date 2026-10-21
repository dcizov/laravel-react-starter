// Marketing sections for the landing page: logo row, statistics, testimonials, pricing, FAQ, and call to action.
// The layouts are adapted from the free Shadcn Space blocks (MIT licence, see THIRD-PARTY-NOTICES.md).
// Text is always plain text, so nothing an admin types can add markup.
import { Check, PlusIcon } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';

function SectionTitle({ title }: { title?: string }) {
    return title ? (
        <h2 className="text-center text-3xl font-medium tracking-tight sm:text-4xl">
            {title}
        </h2>
    ) : null;
}

export function LogosBlock({ data }: { data: BlockData['logos'] }) {
    return (
        <section className="flex flex-col gap-6 py-8">
            {data.title && (
                <p className="text-center text-sm text-muted-foreground">
                    {data.title}
                </p>
            )}
            <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
                {data.items.map((item: LogoItem, index: number) => (
                    // Logo names have no id in the saved data, so the position is the key.
                    <li
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                        className="text-lg font-semibold tracking-tight text-muted-foreground/70"
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
        <section className="flex flex-col gap-8 py-8">
            <SectionTitle title={data.title} />
            <div className="grid gap-4 sm:grid-cols-3">
                {data.items.map((item: StatItem, index: number) => (
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    <Card key={index} className="rounded-2xl border p-6 ring-0">
                        <CardContent className="flex flex-col gap-1 p-0">
                            <p className="text-4xl font-semibold tracking-tight">
                                {item.value}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {item.label}
                            </p>
                        </CardContent>
                    </Card>
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
        <section className="flex flex-col gap-8 py-8">
            <SectionTitle title={data.title} />
            <div className="grid gap-4 md:grid-cols-2">
                {data.items.map((item: TestimonialItem, index: number) => (
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    <Card key={index} className="rounded-2xl border p-6 ring-0">
                        <CardContent className="flex h-full flex-col justify-between gap-6 p-0">
                            <p className="text-lg font-medium">
                                “{item.quote}”
                            </p>
                            <div>
                                <p className="font-medium">{item.name}</p>
                                {item.role && (
                                    <p className="text-sm text-muted-foreground">
                                        {item.role}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}

export function PricingBlock({ data }: { data: BlockData['pricing'] }) {
    return (
        <section className="flex flex-col gap-8 py-8">
            <SectionTitle title={data.title} />
            <div className="grid gap-4 md:grid-cols-2">
                {data.items.map((plan: PricingItem, index: number) => {
                    const features = (plan.features ?? '')
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean);

                    return (
                        <Card
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="rounded-2xl border p-8 ring-0"
                        >
                            <CardContent className="flex h-full flex-col gap-6 p-0">
                                <div className="flex flex-col gap-3">
                                    <Badge className="w-fit">{plan.name}</Badge>
                                    {plan.description && (
                                        <p className="text-sm text-muted-foreground">
                                            {plan.description}
                                        </p>
                                    )}
                                </div>
                                <p className="flex items-end text-4xl font-semibold">
                                    {plan.price}
                                    {plan.period && (
                                        <span className="text-base font-normal text-muted-foreground">
                                            {plan.period}
                                        </span>
                                    )}
                                </p>
                                {features.length > 0 && (
                                    <ul className="flex flex-col gap-3">
                                        {features.map(
                                            (feature, featureIndex) => (
                                                <li
                                                    // eslint-disable-next-line @eslint-react/no-array-index-key
                                                    key={featureIndex}
                                                    className="flex items-center gap-3 text-sm"
                                                >
                                                    <Check
                                                        className="size-4 shrink-0"
                                                        aria-hidden="true"
                                                    />
                                                    {feature}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                )}
                                {plan.button_label && plan.button_url && (
                                    <div className="mt-auto">
                                        <LinkButton
                                            href={plan.button_url}
                                            label={plan.button_label}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
}

export function FaqBlock({ data }: { data: BlockData['faq'] }) {
    return (
        <section className="flex flex-col gap-8 py-8">
            <SectionTitle title={data.title} />
            <Accordion className="flex w-full flex-col gap-3">
                {data.items.map((item: FaqItem, index: number) => (
                    <AccordionItem
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={index}
                        value={`item-${index}`}
                        className="flex flex-col gap-3 rounded-2xl border p-5"
                    >
                        <AccordionTrigger className="p-0 text-left text-base font-medium hover:no-underline [&_svg[data-slot=accordion-trigger-icon]]:!hidden">
                            {item.question}
                            <PlusIcon className="size-5 shrink-0 transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-45" />
                        </AccordionTrigger>
                        {item.answer && (
                            <AccordionContent className="p-0 text-sm text-muted-foreground">
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
        <section className="py-8">
            <div className="relative flex min-h-64 flex-col items-center justify-center gap-6 overflow-hidden rounded-3xl border bg-muted/40 px-6 py-12 text-center">
                <div className="flex max-w-2xl flex-col items-center gap-3">
                    <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
                        {data.title}
                    </h2>
                    {data.text && (
                        <p className="text-muted-foreground">{data.text}</p>
                    )}
                </div>
                {data.button_label && data.button_url && (
                    <LinkButton
                        variant="default"
                        href={data.button_url}
                        label={data.button_label}
                    />
                )}
            </div>
        </section>
    );
}
