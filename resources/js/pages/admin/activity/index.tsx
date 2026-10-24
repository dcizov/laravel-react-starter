import { Head, router } from '@inertiajs/react';
import { Activity as ActivityIcon, Search, X } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type ActivityRow = {
    id: number;
    log: string | null;
    event: string | null;
    description: string;
    causer: string | null;
    subject_type: string | null;
    created_at: string | null;
};

type Group = { date: string; label: string; items: ActivityRow[] };

type Option = { value: string; label: string };

type Props = {
    groups: Group[];
    pagination: {
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
        from: number | null;
        to: number | null;
    };
    filters: { log: string; event: string; causer: number | null; q: string; from: string | null; to: string | null };
    active: boolean;
    options: { logs: string[]; events: string[]; causers: { id: number; name: string }[] };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Team', href: '/admin/users' },
    { title: 'Activity', href: '/admin/activity' },
];

export default function ActivityIndex({ groups, pagination, filters, active, options }: Props) {
    const [log, setLog] = useState(filters.log || 'all');
    const [event, setEvent] = useState(filters.event || 'all');
    const [causer, setCauser] = useState(filters.causer ? String(filters.causer) : 'all');
    const [query, setQuery] = useState(filters.q);
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const [loading, setLoading] = useState(false);

    const visit = (params: Record<string, string | number | undefined>) => {
        router.get('/admin/activity', params, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
        });
    };

    const apply = () =>
        visit({
            log: log === 'all' ? undefined : log,
            event: event === 'all' ? undefined : event,
            causer: causer === 'all' ? undefined : causer,
            q: query.trim() === '' ? undefined : query.trim(),
            from: from === '' ? undefined : from,
            to: to === '' ? undefined : to,
        });

    const reset = () => {
        setLog('all');
        setEvent('all');
        setCauser('all');
        setQuery('');
        setFrom('');
        setTo('');
        visit({});
    };

    const rows = groups.flatMap((group) => group.items);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity" />

            <div className="space-y-5">
                <PageHeader
                    title="Activity"
                    description="Every meaningful change to pages, media, users, settings and addons."
                    actions={
                        active ? (
                            <Button variant="ghost" size="sm" onClick={reset}>
                                <X className="size-3.5" />
                                Clear filters
                            </Button>
                        ) : null
                    }
                />

                <Card className="gap-0 py-0">
                    <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-6">
                        <div className="space-y-1.5 xl:col-span-2">
                            <Label htmlFor="activity-q" className="text-[11px]">
                                Search
                            </Label>
                            <div className="relative">
                                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                                <Input
                                    id="activity-q"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            apply();
                                        }
                                    }}
                                    placeholder="What happened?"
                                    className="h-8 pl-8 text-xs"
                                />
                            </div>
                        </div>

                        <FilterSelect id="activity-log" label="Log" value={log} onChange={setLog} options={options.logs.map((value) => ({ value, label: value }))} />
                        <FilterSelect id="activity-event" label="Event" value={event} onChange={setEvent} options={options.events.map((value) => ({ value, label: value }))} />
                        <FilterSelect
                            id="activity-causer"
                            label="Person"
                            value={causer}
                            onChange={setCauser}
                            options={options.causers.map((user) => ({ value: String(user.id), label: user.name }))}
                        />

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="activity-from" className="text-[11px]">
                                    From
                                </Label>
                                <Input id="activity-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-8 text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="activity-to" className="text-[11px]">
                                    To
                                </Label>
                                <Input id="activity-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-8 text-xs" />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <Button size="sm" className="h-8 w-full" onClick={apply} disabled={loading}>
                                {loading ? 'Filtering…' : 'Apply filters'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <Card className="gap-0 py-0">
                        <CardContent className="space-y-3 p-4" aria-busy="true" aria-label="Loading activity">
                            {[0, 1, 2, 3, 4].map((row) => (
                                <div key={row} className="flex gap-3">
                                    <Skeleton className="size-7 rounded-full" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3 w-1/2" />
                                        <Skeleton className="h-2.5 w-1/3" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ) : rows.length === 0 ? (
                    active ? (
                        <EmptyState
                            icon={Search}
                            title="No activity matches these filters"
                            description="Try a wider date range, another person, or clear the filters to see everything."
                            action={
                                <Button size="sm" variant="outline" onClick={reset}>
                                    Clear filters
                                </Button>
                            }
                        />
                    ) : (
                        <EmptyState
                            icon={ActivityIcon}
                            title="Nothing has happened yet"
                            description="Publish a page, upload media or invite a teammate and the trail starts here."
                        />
                    )
                ) : (
                    <div className="space-y-5">
                        {groups.map((group) => (
                            <section key={group.date} aria-label={group.label}>
                                <h2 className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase">
                                    {group.label}
                                </h2>
                                <Card className="gap-0 py-0">
                                    <ol className="divide-y divide-border/60">
                                        {group.items.map((activity) => (
                                            <li key={activity.id} className="flex gap-3 px-4 py-3">
                                                <span className="bg-muted text-muted-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
                                                    <ActivityIcon className="size-3.5" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm">
                                                        {activity.description}
                                                        {activity.subject_type ? (
                                                            <span className="text-muted-foreground"> · {activity.subject_type}</span>
                                                        ) : null}
                                                    </p>
                                                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                                                        {activity.causer ?? 'System'}
                                                        {activity.event ? ` · ${activity.event}` : ''}
                                                        {activity.log ? ` · ${activity.log}` : ''}
                                                        {' · '}
                                                        {time(activity.created_at)}
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </Card>
                            </section>
                        ))}

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-muted-foreground text-xs">
                                Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total}
                            </p>
                            <div className="flex items-center gap-1">
                                {pager(pagination.links).map((link) => (
                                    <Button
                                        key={link.label}
                                        size="sm"
                                        variant="ghost"
                                        className="h-7"
                                        disabled={link.url === null}
                                        onClick={() => link.url && visitLink(link.url)}
                                    >
                                        {link.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function visitLink(url: string) {
    router.get(url, {}, { preserveState: true, preserveScroll: true });
}

/** Laravel's paginator gives `&laquo; Previous`; the buttons want plain words. */
function pager(links: { url: string | null; label: string; active: boolean }[]) {
    const previous = links[0];
    const next = links[links.length - 1];
    const page = links.find((link) => link.active);

    return [
        { label: 'Previous', url: previous?.url ?? null },
        { label: page ? `Page ${plain(page.label)}` : 'Page 1', url: null },
        { label: 'Next', url: next?.url ?? null },
    ];
}

function plain(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&amp;/g, '&');
}

function FilterSelect({
    id,
    label,
    value,
    onChange,
    options,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-[11px]">
                {label}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={id} className="h-8 w-full text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function time(value: string | null): string {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
