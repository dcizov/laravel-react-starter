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

const sidebarStyles: {
    value: SidebarVariant;
    label: string;
    description: string;
}[] = [
    {
        value: 'inset',
        label: 'Inset',
        description: 'The sidebar sits beside the page in one rounded panel.',
    },
    {
        value: 'floating',
        label: 'Floating',
        description: 'The sidebar floats above the page with its own border.',
    },
];

export default function Appearance({
    sidebarVariant,
}: {
    sidebarVariant: SidebarVariant;
}) {
    const t = useTrans();
    const form = useForm({ sidebar_variant: sidebarVariant });

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
                <AppearanceTabs />
            </ContentSection>

            <Separator className="my-12" />

            <ContentSection
                title={t('Sidebar style')}
                description={t(
                    'Choose how the sidebar is placed on the page. Your choice applies everywhere you sign in.',
                )}
            >
                <form onSubmit={submit} className="space-y-6">
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
                                form.data.sidebar_variant === style.value;

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
                                    <SidebarPreview variant={style.value} />
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

                    <Button type="submit" disabled={form.processing}>
                        {t('Save')}
                    </Button>
                </form>
            </ContentSection>
        </>
    );
}

// A small static drawing of the two layouts, so the choice is visible before saving.
function SidebarPreview({ variant }: { variant: SidebarVariant }) {
    const floating = variant === 'floating';

    return (
        <div
            aria-hidden="true"
            className="flex h-20 gap-1.5 rounded-lg bg-muted p-1.5"
        >
            <div
                className={cn(
                    'w-1/4 rounded-md bg-sidebar',
                    floating && 'border border-sidebar-border shadow-sm',
                )}
            />
            <div
                className={cn(
                    'flex-1 rounded-md bg-background',
                    !floating && 'shadow-sm',
                )}
            />
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
