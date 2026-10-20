import { Head, useForm } from '@inertiajs/react';
import ContentSection from '@/components/settings/content-section';
import { displayGroups } from '@/components/sidebar-items';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldError } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTrans } from '@/hooks/use-trans';
import { edit, update } from '@/routes/display';

export default function Display({ items }: { items: string[] }) {
    const t = useTrans();
    const form = useForm({ items });

    const toggle = (id: string, checked: boolean) => {
        // Keep the saved list in display order so it stays predictable.
        const next = displayGroups
            .flatMap((group) => group.items)
            .map((item) => item.id)
            .filter((itemId) =>
                itemId === id ? checked : form.data.items.includes(itemId),
            );

        form.setData('items', next);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.patch(update().url, { preserveScroll: true });
    };

    return (
        <>
            <Head title={t('Display settings')} />

            <h1 className="sr-only">{t('Display settings')}</h1>

            <ContentSection
                title={t('Display')}
                description={t('Choose which items appear in your sidebar.')}
            >
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-6">
                        {displayGroups.map((group) => (
                            <fieldset key={group.title} className="grid gap-3">
                                <legend className="mb-1 text-sm font-medium text-muted-foreground">
                                    {t(group.title)}
                                </legend>
                                {group.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-2"
                                    >
                                        <Checkbox
                                            id={`display-${item.id}`}
                                            checked={form.data.items.includes(
                                                item.id,
                                            )}
                                            onCheckedChange={(checked) =>
                                                toggle(item.id, checked)
                                            }
                                        />
                                        <Label htmlFor={`display-${item.id}`}>
                                            {t(item.title)}
                                        </Label>
                                    </div>
                                ))}
                            </fieldset>
                        ))}
                        <FieldError>{form.errors.items}</FieldError>
                    </div>

                    <Button type="submit" disabled={form.processing}>
                        {form.processing && <Spinner />}
                        {t('Save')}
                    </Button>
                </form>
            </ContentSection>
        </>
    );
}

Display.layout = {
    breadcrumbs: [
        {
            title: 'Display settings',
            href: edit(),
        },
    ],
};
