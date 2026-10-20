import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUp,
    ArrowRight,
    CircleCheck,
    ListChecks,
    Plus,
    Timer,
    Users,
} from 'lucide-react';
import type { ComponentProps } from 'react';
import { statuses, priorities } from '@/components/tasks/data';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import { edit as editAccount } from '@/routes/account';
import { edit as editProfile } from '@/routes/profile';
import { index as tasksIndex } from '@/routes/tasks';
import { index as usersIndex } from '@/routes/users';
import { dashboard } from '@/routes';

type DashboardTask = {
    id: number;
    code: string;
    title: string;
    status: string;
    label: string;
    priority: string;
    owner?: string | null;
};

type Props = {
    summary: {
        total: number;
        open: number;
        in_progress: number;
        done: number;
        high_priority: number;
    };
    statusCounts: { status: string; count: number }[];
    attention: DashboardTask[];
    recent: DashboardTask[];
    showOwner: boolean;
    // Null when the user cannot see the Users page.
    usersCount: number | null;
};

// The start page after sign-in. Counts and lists come from the server, scoped to the tasks the user can see.
export default function Dashboard({
    summary,
    statusCounts,
    attention,
    recent,
    showOwner,
    usersCount,
}: Props) {
    const t = useTrans();
    const { auth } = usePage().props;

    const stats = [
        {
            title: t('Open tasks'),
            value: summary.open,
            hint: t('Not done or canceled'),
            icon: ListChecks,
        },
        {
            title: t('In progress'),
            value: summary.in_progress,
            hint: t('Being worked on now'),
            icon: Timer,
        },
        {
            title: t('Done'),
            value: summary.done,
            hint: t('Finished tasks'),
            icon: CircleCheck,
        },
        {
            title: t('High priority'),
            value: summary.high_priority,
            hint: t('Open and marked high'),
            icon: ArrowUp,
        },
        ...(usersCount !== null
            ? [
                  {
                      title: t('Users'),
                      value: usersCount,
                      hint: t('Accounts in the app'),
                      icon: Users,
                  },
              ]
            : []),
    ];

    return (
        <>
            <Head title={t('Dashboard')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t('Welcome back, :name', { name: auth.user.name })}
                    </h1>
                    <p className="text-muted-foreground">
                        {summary.total === 0
                            ? t('There are no tasks yet.')
                            : t('Here is where your tasks stand today.')}
                    </p>
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-4">
                    {stats.map((stat) => (
                        <Card key={stat.title}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                    <stat.icon className="size-4" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <div className="text-3xl font-bold tabular-nums">
                                    {stat.value}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stat.hint}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>{t('Needs attention')}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {t('Open tasks marked high priority.')}
                            </p>
                        </CardHeader>
                        <CardContent>
                            {attention.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    {t('Nothing urgent right now.')}
                                </p>
                            ) : (
                                <TaskList
                                    tasks={attention}
                                    showOwner={showOwner}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('By status')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="divide-y">
                                {statusCounts.map((item) => {
                                    const status = statuses.find(
                                        (option) =>
                                            option.value === item.status,
                                    );

                                    return (
                                        <li
                                            key={item.status}
                                            className="flex items-center justify-between py-2 text-sm"
                                        >
                                            <span className="flex items-center gap-2">
                                                {status?.icon && (
                                                    <status.icon className="size-4 text-muted-foreground" />
                                                )}
                                                {t(
                                                    status?.label ??
                                                        item.status,
                                                )}
                                            </span>
                                            <span className="font-medium tabular-nums">
                                                {item.count}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>{t('Recent changes')}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {t(
                                    'The latest tasks that were created or updated.',
                                )}
                            </p>
                        </CardHeader>
                        <CardContent>
                            {summary.total === 0 ? (
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <ListChecks />
                                        </EmptyMedia>
                                        <EmptyTitle>
                                            {t('No tasks yet')}
                                        </EmptyTitle>
                                        <EmptyDescription>
                                            {showOwner
                                                ? t(
                                                      'No one has created a task yet.',
                                                  )
                                                : t(
                                                      'Tasks belong to the account that created them, so you only see the ones you create.',
                                                  )}
                                        </EmptyDescription>
                                    </EmptyHeader>
                                    <EmptyContent>
                                        <Link
                                            href={tasksIndex()}
                                            className={cn(
                                                buttonVariants({ size: 'sm' }),
                                            )}
                                        >
                                            <Plus />
                                            {t('Create task')}
                                        </Link>
                                    </EmptyContent>
                                </Empty>
                            ) : (
                                <TaskList
                                    tasks={recent}
                                    showOwner={showOwner}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Quick actions')}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <QuickAction
                                href={tasksIndex()}
                                label={t('Go to tasks')}
                            />
                            {usersCount !== null && (
                                <QuickAction
                                    href={usersIndex()}
                                    label={t('Manage users')}
                                />
                            )}
                            <QuickAction
                                href={editProfile()}
                                label={t('Edit profile')}
                            />
                            <QuickAction
                                href={editAccount()}
                                label={t('Account settings')}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

// A short list of tasks with their status and priority. Links go to the Tasks page.
function TaskList({
    tasks,
    showOwner,
}: {
    tasks: DashboardTask[];
    showOwner: boolean;
}) {
    const t = useTrans();

    return (
        <ul className="divide-y">
            {tasks.map((task) => {
                const status = statuses.find(
                    (option) => option.value === task.status,
                );
                const priority = priorities.find(
                    (option) => option.value === task.priority,
                );

                return (
                    <li
                        key={task.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                    >
                        <div className="flex min-w-0 flex-col">
                            <Link
                                href={tasksIndex()}
                                className="truncate font-medium hover:underline"
                            >
                                {task.title}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                                {task.code}
                                {showOwner && task.owner
                                    ? ` · ${task.owner}`
                                    : ''}
                            </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            {priority && (
                                <Badge variant="outline">
                                    {t(priority.label)}
                                </Badge>
                            )}
                            {status && (
                                <Badge variant="secondary">
                                    {status.icon && (
                                        <status.icon className="size-3" />
                                    )}
                                    {t(status.label)}
                                </Badge>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

function QuickAction({
    href,
    label,
}: {
    href: ComponentProps<typeof Link>['href'];
    label: string;
}) {
    return (
        <Link
            href={href}
            className={cn(
                buttonVariants({ variant: 'outline' }),
                'justify-between',
            )}
        >
            {label}
            <ArrowRight />
        </Link>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
