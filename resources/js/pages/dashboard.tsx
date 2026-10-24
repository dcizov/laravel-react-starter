import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    FileText,
    Image as ImageIcon,
    Plug,
    Sparkles,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/admin' }];

const kpis = [
    {
        label: 'Published pages',
        value: '0',
        hint: 'Nothing is live yet',
        icon: FileText,
    },
    {
        label: 'Media items',
        value: '0',
        hint: 'Library is empty',
        icon: ImageIcon,
    },
    {
        label: 'Active addons',
        value: '0',
        hint: 'No addons installed',
        icon: Plug,
    },
    {
        label: 'Team members',
        value: '1',
        hint: 'Just you for now',
        icon: Sparkles,
    },
];

export default function Dashboard() {
    const { auth } = usePage().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-8">
                <PageHeader
                    title={`Welcome back, ${auth.user?.name ?? 'there'}`}
                    description="This is the Lattice admin shell. Pages, media, addons and themes appear here as the platform is wired up."
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <a href="/" target="_blank" rel="noreferrer">
                                    View site
                                    <ArrowUpRight className="size-4" />
                                </a>
                            </Button>
                            <Button disabled>New page</Button>
                        </>
                    }
                />

                <section aria-label="Key figures">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {kpis.map((kpi) => (
                            <Card key={kpi.label} className="gap-2 py-5">
                                <CardHeader className="flex flex-row items-center justify-between px-5">
                                    <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        {kpi.label}
                                    </CardTitle>
                                    <kpi.icon className="size-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent className="px-5">
                                    <p className="text-3xl font-semibold tracking-tight">
                                        {kpi.value}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {kpi.hint}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-3">
                    <section
                        className="lg:col-span-2"
                        aria-label="Recent pages"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold">
                                Recent pages
                            </h2>
                            <Link
                                href="/admin/pages"
                                className="text-sm text-muted-foreground hover:text-foreground"
                            >
                                All pages
                            </Link>
                        </div>
                        <EmptyState
                            icon={FileText}
                            title="No pages yet"
                            description="Pages are the core content type. Once the pages module lands you can draft, schedule and publish them here."
                        />
                    </section>

                    <section aria-label="System status" className="space-y-3">
                        <h2 className="text-sm font-semibold">System</h2>
                        <Card className="gap-0 py-0">
                            <ul className="divide-y divide-border/60 text-sm">
                                <li className="flex items-center justify-between px-4 py-3">
                                    <span className="text-muted-foreground">
                                        Platform
                                    </span>
                                    <span className="font-medium">
                                        Lattice 0.1
                                    </span>
                                </li>
                                <li className="flex items-center justify-between px-4 py-3">
                                    <span className="text-muted-foreground">
                                        Active theme
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Not installed yet
                                    </span>
                                </li>
                                <li className="flex items-center justify-between px-4 py-3">
                                    <span className="text-muted-foreground">
                                        Addon health
                                    </span>
                                    <StatusBadge status="draft" />
                                </li>
                                <li className="flex items-center justify-between px-4 py-3">
                                    <span className="text-muted-foreground">
                                        Your role
                                    </span>
                                    <span className="font-medium">
                                        Administrator
                                    </span>
                                </li>
                            </ul>
                        </Card>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
