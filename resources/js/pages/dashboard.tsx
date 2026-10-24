import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    CircleAlert,
    Eye,
    FileText,
    Image as ImageIcon,
    Plug,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useBreadcrumbs } from '@/components/breadcrumbs-context';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

type Kpi = {
    key: string;
    label: string;
    value: number;
    hint: string;
    icon: string;
    href: string | null;
};

type Point = { date: string; label: string; views: number };

type Draft = {
    id: number;
    title: string;
    slug: string;
    author: string | null;
    updated_at: string | null;
    edit_url: string;
};

type ActivityRow = {
    id: number;
    log: string | null;
    event: string | null;
    description: string;
    causer: string | null;
    created_at: string | null;
};

type AddonRow = {
    handle: string;
    name: string;
    version: string;
    status: string;
    error: string | null;
};

type Props = {
    kpis: Kpi[];
    traffic: {
        series: Point[];
        total: number;
        previous: number;
        change: number | null;
        days: number;
    };
    recent: ActivityRow[];
    drafts: Draft[];
    addons: {
        rows: AddonRow[];
        healthy: number;
        errors: number;
        inactive: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/admin' }];

const icons: Record<string, LucideIcon> = {
    'file-text': FileText,
    eye: Eye,
    image: ImageIcon,
    users: Users,
};

export default function Dashboard({
    kpis,
    traffic,
    recent,
    drafts,
    addons,
}: Props) {
    const { auth } = usePage().props;

    useBreadcrumbs(breadcrumbs);

    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <PageHeader
                    title={`Welcome back, ${auth.user?.name ?? 'there'}`}
                    description="Traffic, drafts and extension health at a glance."
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <a href="/" target="_blank" rel="noreferrer">
                                    View site
                                    <ArrowUpRight className="size-4" />
                                </a>
                            </Button>
                            {auth.can?.['pages.create'] ? (
                                <Button asChild>
                                    <Link href="/admin/pages/create">
                                        New page
                                    </Link>
                                </Button>
                            ) : null}
                        </>
                    }
                />

                <section
                    aria-label="Key figures"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {kpis.map((kpi) => {
                        const Icon = icons[kpi.icon] ?? FileText;

                        return (
                            <Card key={kpi.key} className="gap-2 py-5">
                                <CardHeader className="flex flex-row items-center justify-between px-5">
                                    <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        {kpi.label}
                                    </CardTitle>
                                    <Icon className="size-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent className="px-5">
                                    <p className="text-3xl font-semibold tracking-tight">
                                        {kpi.value.toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {kpi.href ? (
                                            <Link
                                                href={kpi.href}
                                                className="underline-offset-4 hover:text-foreground hover:underline"
                                            >
                                                {kpi.hint}
                                            </Link>
                                        ) : (
                                            kpi.hint
                                        )}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>

                <div className="grid gap-6 lg:grid-cols-3">
                    <section className="lg:col-span-2" aria-label="Page views">
                        <Card className="h-full">
                            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                                <div>
                                    <CardTitle className="text-sm">
                                        Page views
                                    </CardTitle>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Last {traffic.days} days
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-semibold tracking-tight">
                                        {traffic.total.toLocaleString()}
                                    </p>
                                    <p
                                        className={cn(
                                            'text-[11px]',
                                            traffic.change === null
                                                ? 'text-muted-foreground'
                                                : traffic.change >= 0
                                                  ? 'text-status-published'
                                                  : 'text-status-error',
                                        )}
                                    >
                                        {traffic.change === null
                                            ? 'No history yet'
                                            : `${traffic.change >= 0 ? '+' : ''}${traffic.change}% vs previous`}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <AreaChart series={traffic.series} />
                            </CardContent>
                        </Card>
                    </section>

                    <section aria-label="Addon health" className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold">
                                Addon health
                            </h2>
                            <Link
                                href="/admin/addons"
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                Manage
                            </Link>
                        </div>
                        <Card className="gap-0 py-0">
                            {addons.rows.length === 0 ? (
                                <p className="px-4 py-6 text-xs text-muted-foreground">
                                    No addons installed yet.
                                </p>
                            ) : (
                                <ul className="divide-y divide-border/60 text-sm">
                                    {addons.rows.map((row) => (
                                        <li
                                            key={row.handle}
                                            className="flex items-start justify-between gap-2 px-4 py-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-medium">
                                                    {row.name}
                                                </p>
                                                {row.error ? (
                                                    <p className="mt-0.5 flex items-start gap-1 text-[11px] text-status-error">
                                                        <CircleAlert className="mt-0.5 size-3 shrink-0" />
                                                        <span className="line-clamp-2">
                                                            {row.error}
                                                        </span>
                                                    </p>
                                                ) : (
                                                    <p className="text-[11px] text-muted-foreground">
                                                        v{row.version}
                                                    </p>
                                                )}
                                            </div>
                                            <AddonStatus status={row.status} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                        <Card className="gap-0 py-0">
                            <ul className="divide-y divide-border/60 text-xs text-muted-foreground">
                                <li className="flex items-center justify-between px-4 py-2.5">
                                    <span>Active</span>
                                    <span className="font-medium text-foreground">
                                        {addons.healthy}
                                    </span>
                                </li>
                                <li className="flex items-center justify-between px-4 py-2.5">
                                    <span>Inactive</span>
                                    <span className="font-medium text-foreground">
                                        {addons.inactive}
                                    </span>
                                </li>
                                <li className="flex items-center justify-between px-4 py-2.5">
                                    <span>Errors</span>
                                    <span
                                        className={cn(
                                            'font-medium',
                                            addons.errors > 0
                                                ? 'text-status-error'
                                                : 'text-foreground',
                                        )}
                                    >
                                        {addons.errors}
                                    </span>
                                </li>
                            </ul>
                        </Card>
                    </section>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <section aria-label="Drafts" className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold">Drafts</h2>
                            <Link
                                href="/admin/pages?status=draft"
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                All pages
                            </Link>
                        </div>
                        {drafts.length === 0 ? (
                            <EmptyState
                                icon={FileText}
                                title="Nothing in draft"
                                description="Pages you start but do not publish yet show up here."
                                action={
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href="/admin/pages">
                                            Open pages
                                        </Link>
                                    </Button>
                                }
                            />
                        ) : (
                            <Card className="gap-0 py-0">
                                <ul className="divide-y divide-border/60">
                                    {drafts.map((draft) => (
                                        <li
                                            key={draft.id}
                                            className="flex items-center justify-between gap-3 px-4 py-3"
                                        >
                                            <div className="min-w-0">
                                                <Link
                                                    href={draft.edit_url}
                                                    className="truncate text-sm font-medium underline-offset-4 hover:underline"
                                                >
                                                    {draft.title}
                                                </Link>
                                                <p className="text-[11px] text-muted-foreground">
                                                    /{draft.slug} ·{' '}
                                                    {draft.author ?? 'Unknown'}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[11px] text-muted-foreground">
                                                {relative(draft.updated_at)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}
                    </section>

                    <section aria-label="Recent activity" className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold">
                                Recent activity
                            </h2>
                            <Link
                                href="/admin/activity"
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                Full timeline
                            </Link>
                        </div>
                        {recent.length === 0 ? (
                            <EmptyState
                                icon={Plug}
                                title="No activity yet"
                                description="Creating, editing and publishing all get recorded here."
                            />
                        ) : (
                            <Card className="gap-0 py-0">
                                <ul className="divide-y divide-border/60">
                                    {recent.map((row) => (
                                        <li
                                            key={row.id}
                                            className="flex items-start gap-3 px-4 py-3"
                                        >
                                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs">
                                                    {row.description}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {row.causer ?? 'System'} ·{' '}
                                                    {row.log ?? 'lattice'} ·{' '}
                                                    {relative(row.created_at)}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

const addonTone: Record<string, string> = {
    active: 'bg-status-published-soft text-status-published border-status-published/30',
    inactive: 'bg-status-draft-soft text-status-draft border-status-draft/25',
    error: 'bg-status-error-soft text-status-error border-status-error/30',
};

function AddonStatus({ status }: { status: string }) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize',
                addonTone[status] ?? addonTone.inactive,
            )}
        >
            <span
                className="size-1.5 rounded-full bg-current"
                aria-hidden="true"
            />
            {status}
        </span>
    );
}

/**
 * A small inline area chart. No chart library: the data is fourteen integers,
 * and an SVG keeps it crisp, themable and cheap.
 */
function AreaChart({ series }: { series: Point[] }) {
    if (series.length === 0) {
        return (
            <p className="py-10 text-center text-xs text-muted-foreground">
                No traffic recorded yet.
            </p>
        );
    }

    const width = 600;
    const height = 140;
    const padding = 6;
    const max = Math.max(1, ...series.map((point) => point.views));
    const stepX =
        series.length > 1 ? (width - padding * 2) / (series.length - 1) : 0;

    const points = series.map((point, index) => ({
        x: padding + index * stepX,
        y: height - padding - (point.views / max) * (height - padding * 2),
        ...point,
    }));

    const line = points
        .map(
            (point, index) =>
                `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`,
        )
        .join(' ');
    const area = `${line} L${points[points.length - 1].x.toFixed(1)},${height - padding} L${points[0].x.toFixed(1)},${height - padding} Z`;

    return (
        <figure className="space-y-2">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label={`Page views for the last ${series.length} days, ${series.reduce((sum, point) => sum + point.views, 0)} in total`}
                className="h-36 w-full"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient
                        id="traffic-fill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stopColor="var(--color-primary)"
                            stopOpacity="0.28"
                        />
                        <stop
                            offset="100%"
                            stopColor="var(--color-primary)"
                            stopOpacity="0.02"
                        />
                    </linearGradient>
                </defs>
                <path d={area} fill="url(#traffic-fill)" />
                <path
                    d={line}
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                />
                {points.map((point) => (
                    <circle
                        key={point.date}
                        cx={point.x}
                        cy={point.y}
                        r="2.5"
                        fill="var(--color-primary)"
                        vectorEffect="non-scaling-stroke"
                    >
                        <title>{`${point.label}: ${point.views} views`}</title>
                    </circle>
                ))}
            </svg>

            <figcaption className="flex justify-between text-[11px] text-muted-foreground">
                <span>{series[0].label}</span>
                <span>peak {max.toLocaleString()}</span>
                <span>{series[series.length - 1].label}</span>
            </figcaption>

            <table className="sr-only">
                <caption>Page views per day</caption>
                <tbody>
                    {series.map((point) => (
                        <tr key={point.date}>
                            <th scope="row">{point.label}</th>
                            <td>{point.views}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}

function relative(value: string | null): string {
    if (!value) {
        return 'just now';
    }

    const date = new Date(value);
    const minutes = Math.round((Date.now() - date.getTime()) / 60000);

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

    return `${Math.round(hours / 24)} d ago`;
}
