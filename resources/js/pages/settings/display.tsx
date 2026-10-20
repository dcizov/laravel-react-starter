import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import ContentSection from '@/components/settings/content-section';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { edit, update } from '@/routes/display';

// Must match App\Support\DisplaySettings::ITEMS on the server.
const displayItems = [
    { id: 'recents', label: 'Recents' },
    { id: 'home', label: 'Home' },
    { id: 'applications', label: 'Applications' },
    { id: 'desktop', label: 'Desktop' },
    { id: 'downloads', label: 'Downloads' },
    { id: 'documents', label: 'Documents' },
];

export default function Display({ items }: { items: string[] }) {
    const form = useForm({ items });

    const toggle = (id: string, checked: boolean) => {
        // Keep the saved list in display order so it stays predictable.
        const next = displayItems
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
            <Head title="Display settings" />

            <h1 className="sr-only">Display settings</h1>

            <ContentSection
                title="Display"
                description="Choose which items appear in your sidebar."
            >
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-3">
                        {displayItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-2"
                            >
                                <Checkbox
                                    id={`display-${item.id}`}
                                    checked={form.data.items.includes(item.id)}
                                    onCheckedChange={(checked) =>
                                        toggle(item.id, checked)
                                    }
                                />
                                <Label htmlFor={`display-${item.id}`}>
                                    {item.label}
                                </Label>
                            </div>
                        ))}
                        <InputError message={form.errors.items} />
                    </div>

                    <Button type="submit" disabled={form.processing}>
                        Save
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
