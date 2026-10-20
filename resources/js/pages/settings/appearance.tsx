import { Head, useForm } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import InputError from '@/components/input-error';
import ContentSection from '@/components/settings/content-section';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import { edit as editAppearance, update } from '@/routes/appearance';

type SidebarVariant = 'inset' | 'floating';
type FontKey = 'instrument-sans' | 'inter' | 'manrope' | 'system';

const sidebarStyles: {
    value: SidebarVariant;
    label: string;
    description: string;
}[] = [
    {
        value: 'inset',
        label: 'Inset',
        description: 'The sidebar sits flush against the page edge.',
    },
    {
        value: 'floating',
        label: 'Floating',
        description:
            'The sidebar floats above the page with its own border and shadow.',
    },
];

const fonts: {
    value: FontKey;
    label: string;
    family: string;
}[] = [
    {
        value: 'instrument-sans',
        label: 'Instrument Sans',
        family: "'Instrument Sans Variable', 'Instrument Sans', sans-serif",
    },
    {
        value: 'inter',
        label: 'Inter',
        family: "'Inter Variable', 'Inter', sans-serif",
    },
    {
        value: 'manrope',
        label: 'Manrope',
        family: "'Manrope Variable', 'Manrope', sans-serif",
    },
    {
        value: 'system',
        label: 'System font',
        family: 'ui-sans-serif, system-ui, sans-serif',
    },
];

export default function Appearance({
    sidebarVariant,
    font,
}: {
    sidebarVariant: SidebarVariant;
    font: FontKey;
}) {
    const t = useTrans();
    const form = useForm({
        sidebar_variant: sidebarVariant,
        font,
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.patch(update().url, { preserveScroll: true });
    };

    return (
        <>
            <Head title={t('Appearance settings')} />

            <h1 className="sr-only">{t('Appearance settings')}</h1>

            <ContentSection
                title={t('Appearance settings')}
                description={t(
                    'Update the appearance settings for your account',
                )}
            >
                <div className="space-y-8">
                    <section className="space-y-4">
                        <div className="space-y-1">
                            <h3 className="font-medium">{t('Theme')}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t(
                                    'Light and dark apply right away on this device.',
                                )}
                            </p>
                        </div>
                        <AppearanceTabs />
                    </section>

                    <Separator />

                    <form onSubmit={submit} className="space-y-8">
                        <section className="space-y-4">
                            <div className="space-y-1">
                                <h3 className="font-medium">{t('Font')}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t(
                                        'Choose the typeface used across the app.',
                                    )}
                                </p>
                            </div>

                            <RadioGroup
                                value={form.data.font}
                                onValueChange={(value) =>
                                    form.setData('font', value as FontKey)
                                }
                                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                            >
                                {fonts.map((option) => {
                                    const selected =
                                        form.data.font === option.value;

                                    return (
                                        <Label
                                            key={option.value}
                                            htmlFor={`font-${option.value}`}
                                            className={cn(
                                                'flex cursor-pointer flex-col gap-3 rounded-xl border p-4 font-normal transition-colors hover:bg-muted/50',
                                                selected &&
                                                    'border-primary bg-muted/40',
                                            )}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="text-3xl leading-none"
                                                style={{
                                                    fontFamily: option.family,
                                                }}
                                            >
                                                Aa
                                            </span>
                                            <span className="flex items-center gap-3">
                                                <RadioGroupItem
                                                    id={`font-${option.value}`}
                                                    value={option.value}
                                                />
                                                <span className="font-medium">
                                                    {t(option.label)}
                                                </span>
                                            </span>
                                        </Label>
                                    );
                                })}
                            </RadioGroup>
                            <InputError message={form.errors.font} />
                        </section>

                        <Separator />

                        <section className="space-y-4">
                            <div className="space-y-1">
                                <h3 className="font-medium">
                                    {t('Sidebar style')}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {t(
                                        'Choose how the sidebar is placed on the page. Your choice applies everywhere you sign in.',
                                    )}
                                </p>
                            </div>

                            <RadioGroup
                                value={form.data.sidebar_variant}
                                onValueChange={(value) =>
                                    form.setData(
                                        'sidebar_variant',
                                        value as SidebarVariant,
                                    )
                                }
                                className="grid gap-4 sm:grid-cols-2"
                            >
                                {sidebarStyles.map((style) => {
                                    const selected =
                                        form.data.sidebar_variant ===
                                        style.value;

                                    return (
                                        <Label
                                            key={style.value}
                                            htmlFor={`sidebar-${style.value}`}
                                            className={cn(
                                                'flex cursor-pointer flex-col gap-3 rounded-xl border p-4 font-normal transition-colors hover:bg-muted/50',
                                                selected &&
                                                    'border-primary bg-muted/40',
                                            )}
                                        >
                                            <SidebarPreview
                                                variant={style.value}
                                            />
                                            <span className="flex items-start gap-3">
                                                <RadioGroupItem
                                                    id={`sidebar-${style.value}`}
                                                    value={style.value}
                                                    className="mt-0.5"
                                                />
                                                <span className="grid gap-1">
                                                    <span className="font-medium">
                                                        {t(style.label)}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {t(style.description)}
                                                    </span>
                                                </span>
                                            </span>
                                        </Label>
                                    );
                                })}
                            </RadioGroup>

                            <InputError message={form.errors.sidebar_variant} />
                        </section>

                        <Button type="submit" disabled={form.processing}>
                            {t('Save')}
                        </Button>
                    </form>
                </div>
            </ContentSection>
        </>
    );
}

// A small drawing of the two layouts, so the choice is visible before saving.
function SidebarPreview({ variant }: { variant: SidebarVariant }) {
    const floating = variant === 'floating';

    return (
        <div
            aria-hidden="true"
            className="flex h-20 gap-1.5 overflow-hidden rounded-md border bg-muted p-1.5"
        >
            <div
                className={cn(
                    'w-1/4 rounded-md bg-sidebar',
                    floating && 'border border-sidebar-border shadow-sm',
                )}
            />
            <div className="flex-1 rounded-md bg-background" />
        </div>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
