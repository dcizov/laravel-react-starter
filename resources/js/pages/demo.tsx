import { Head, usePage } from '@inertiajs/react';
import { FlaskConical } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type DemoNote = {
    id: number;
    body: string;
    created_at: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Site', href: '/admin' },
    { title: 'Demo', href: '/admin/demo' },
];

export default function Demo() {
    const { notes } = usePage<{ notes: DemoNote[] }>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Demo addon" />

            <div className="space-y-6">
                <PageHeader
                    title="Demo addon"
                    description="This screen only exists while the Demo addon is active. Deactivate it and the navigation entry and route disappear, while its table and rows stay behind."
                />

                {notes.length === 0 ? (
                    <EmptyState
                        icon={FlaskConical}
                        title="The addon is active but has no notes"
                        description="Activation writes one note through the addon's Activator hook. Re-activate the addon to see it happen again."
                    />
                ) : (
                    <Card className="gap-0 py-0">
                        <CardContent className="divide-y divide-border/60 p-0">
                            {notes.map((note) => (
                                <div
                                    key={note.id}
                                    className="flex items-center gap-3 px-4 py-3"
                                >
                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <FlaskConical className="size-3.5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm">
                                            {note.body}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {note.created_at}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
