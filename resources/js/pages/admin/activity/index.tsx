import { Head, router } from '@inertiajs/react';
import { Activity as ActivityIcon } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type ActivityRow = {
    id: number;
    log: string | null;
    event: string | null;
    description: string;
    causer: string | null;
    subject_type: string | null;
    properties: Record<string, unknown>;
    created_at: string | null;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    activities: Paginated<ActivityRow>;
    filters: { log: string };
    logs: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Team', href: '/admin/users' },
    { title: 'Activity', href: '/admin/activity' },
];

function relative(value: string | null): string {
    if (value === null) {
        return '';
    }

    const date = new Date(value);
    const diff = Date.now() - date.getTime();
    const minutes = Math.round(diff / 60000);

    if (minutes < 1) {
        return 'just now';
    }

    if (minutes < 60) {
        return `${minutes} min ago`;
    }

    const hours = Math.round(minutes / 60);

    if (hours < 24) {
        return `${hours} h ago`;
    }

    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

export default function ActivityIndex({ activities, filters, logs }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity" />

            <div className="space-y-6">
                <PageHeader
                    title="Activity"
                    description="Every meaningful change to pages, media, users and addons is recorded here."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant={
                                    filters.log === '' ? 'secondary' : 'ghost'
                                }
                                size="sm"
                                onClick={() =>
                                    router.get(
                                        '/admin/activity',
                                        {},
                                        { preserveState: true },
                                    )
                                }
                            >
                                All
                            </Button>
                            {logs.map((log) => (
                                <Button
                                    key={log}
                                    variant={
                                        filters.log === log
                                            ? 'secondary'
                                            : 'ghost'
                                    }
                                    size="sm"
                                    onClick={() =>
                                        router.get(
                                            '/admin/activity',
                                            { log },
                                            { preserveState: true },
                                        )
                                    }
                                >
                                    {log}
                                </Button>
                            ))}
                        </div>
                    }
                />

                {activities.data.length === 0 ? (
                    <EmptyState
                        icon={ActivityIcon}
                        title="Nothing has happened yet"
                        description="Publish a page, upload media or invite a teammate and the trail starts here."
                    />
                ) : (
                    <Card className="gap-0 py-0">
                        <CardContent className="p-0">
                            <ol className="divide-y divide-border/60">
                                {activities.data.map((activity) => (
                                    <li
                                        key={activity.id}
                                        className="flex gap-3 px-4 py-3"
                                    >
                                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                            <ActivityIcon className="size-3.5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm">
                                                {activity.description}
                                                {activity.subject_type ? (
                                                    <span className="text-muted-foreground">
                                                        {' '}
                                                        ·{' '}
                                                        {activity.subject_type}
                                                    </span>
                                                ) : null}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {activity.causer ?? 'System'}
                                                {activity.event
                                                    ? ` · ${activity.event}`
                                                    : ''}
                                                {activity.log
                                                    ? ` · ${activity.log}`
                                                    : ''}
                                                {' · '}
                                                {relative(activity.created_at)}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
