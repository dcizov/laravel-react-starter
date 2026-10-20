import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUp,
    CircleCheck,
    ListChecks,
    Plus,
    Timer,
    TrendingDown,
    TrendingUp,
    Users,
} from 'lucide-react';
import type { ComponentProps } from 'react';
import PageHeader from '@/components/page-header';
import { statuses, priorities } from '@/components/tasks/data';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import {
    Progress,
    ProgressLabel,
    ProgressValue,
} from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        completion: number;
        created_this_week: number;
        // Percent change against last week, or null when last week had no tasks.
        created_change: number | null;
    };
    statusCounts: { status: string; count: number }[];
    attention: DashboardTask[];
    recent: DashboardTask[];
    showOwner: boolean;
    // Null when the user cannot see the Users page.
    usersCount: number | null;
};

// The start page after sign-in. Every number and list comes from the server, scoped to the tasks the user can see.
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
    const empty = summary.total === 0;

    const stats = [
        {
            title: t('Total tasks'),
            value: summary.total,
            icon: ListChecks,
            change: summary.created_change,
        },
        {
            title: t('Open tasks'),
            value: summary.open,
            hint: t('Not done or canceled'),
            icon: Timer,
        },
        {
            title: t('High priority'),
            value: summary.high_priority,
            hint: t('Open and marked high'),
            icon: ArrowUp,
        },
        {
            title: t('Done'),
            value: summary.done,
            hint: t('Finished tasks'),
            icon: CircleCheck,
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
                <PageHeader
                    title={t('Welcome back, :name', {
                        name: auth.user.name,
                    })}
                    description={
                        empty
                            ? t('There are no tasks yet.')
                            : t('Here is where your tasks stand today.')
                    }
                    actions={
                        <>
                            <Link
                                href={tasksIndex()}
                                className={cn(buttonVariants({ size: 'sm' }))}
                            >
                                <Plus />
                                {t('Create task')}
                            </Link>
                        </>
                    }
                />

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">
                            {t('Overview')}
                        </TabsTrigger>
                        <TabsTrigger value="activity">
                            {t('Recent activity')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-4">
                            {stats.map((stat) => (
                                <Card key={stat.title}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {stat.title}
                                        </CardTitle>
                                        <stat.icon className="size-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="text-3xl font-bold tabular-nums">
                                            {stat.value}
                                        </div>
                                        {'change' in stat ? (
                                            <ChangeBadge
                                                change={stat.change ?? null}
                                            />
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                {stat.hint}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {empty ? (
                            <Card>
                                <CardContent>
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
                                                    buttonVariants({
                                                        size: 'sm',
                                                    }),
                                                )}
                                            >
                                                <Plus />
                                                {t('Create task')}
                                            </Link>
                                        </EmptyContent>
                                    </Empty>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 lg:grid-cols-3">
                                <Card className="lg:col-span-2">
                                    <CardHeader>
                                        <CardTitle>
                                            {t('Needs attention')}
                                        </CardTitle>
                                        <CardDescription>
                                            {t(
                                                'Open tasks marked high priority.',
                                            )}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {attention.length === 0 ? (
                                            <p className="py-6 text-center text-sm text-muted-foreground">
                                                {t('Nothing urgent right now.')}
                                            </p>
                                        ) : (
                                            <TaskItems
                                                tasks={attention}
                                                showOwner={showOwner}
                                            />
                                        )}
                                    </CardContent>
                                    <CardFooter className="justify-end">
                                        <Link
                                            href={tasksIndex()}
                                            className={cn(
                                                buttonVariants({
                                                    variant: 'outline',
                                                    size: 'sm',
                                                }),
                                            )}
                                        >
                                            {t('View all tasks')}
                                        </Link>
                                    </CardFooter>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('By status')}</CardTitle>
                                        <CardDescription>
                                            {t(
                                                'How many tasks are in each status.',
                                            )}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        <Progress value={summary.completion}>
                                            <ProgressLabel>
                                                {t('Completion')}
                                            </ProgressLabel>
                                            <ProgressValue>
                                                {() => `${summary.completion}%`}
                                            </ProgressValue>
                                        </Progress>
                                        <ul className="space-y-3">
                                            {statusCounts.map((item) => (
                                                <StatusRow
                                                    key={item.status}
                                                    status={item.status}
                                                    count={item.count}
                                                    total={summary.total}
                                                />
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="activity">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Recent changes')}</CardTitle>
                                <CardDescription>
                                    {t(
                                        'The latest tasks that were created or updated.',
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {empty ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        {t('No tasks yet')}
                                    </p>
                                ) : (
                                    <TaskItems
                                        tasks={recent}
                                        showOwner={showOwner}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('Quick actions')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
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
        </>
    );
}

// Percent change against last week, shown as a badge. A new account has no last week, so it says so.
function ChangeBadge({ change }: { change: number | null }) {
    const t = useTrans();

    if (change === null) {
        return <Badge variant="outline">{t('New this week')}</Badge>;
    }

    const up = change >= 0;
    const Icon = up ? TrendingUp : TrendingDown;

    return (
        <div className="flex items-center gap-2">
            <Badge variant={up ? 'secondary' : 'outline'}>
                <Icon />
                {`${up ? '+' : ''}${change}%`}
            </Badge>
            <span className="text-xs text-muted-foreground">
                {t('vs last week')}
            </span>
        </div>
    );
}

// One status with its count and the share of all tasks it holds.
function StatusRow({
    status,
    count,
    total,
}: {
    status: string;
    count: number;
    total: number;
}) {
    const t = useTrans();
    const option = statuses.find((item) => item.value === status);
    const share = total > 0 ? Math.round((count / total) * 100) : 0;

    return (
        <li className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                    {option?.icon && (
                        <option.icon className="size-4 text-muted-foreground" />
                    )}
                    {t(option?.label ?? status)}
                </span>
                <span className="font-medium tabular-nums">{count}</span>
            </div>
            <Progress value={share} aria-label={t(option?.label ?? status)} />
        </li>
    );
}

// Tasks as items: status icon, title, owner, and priority. Owners show as avatars when the user sees every task.
function TaskItems({
    tasks,
    showOwner,
}: {
    tasks: DashboardTask[];
    showOwner: boolean;
}) {
    const t = useTrans();

    return (
        <ItemGroup>
            {tasks.map((task) => {
                const status = statuses.find(
                    (option) => option.value === task.status,
                );
                const priority = priorities.find(
                    (option) => option.value === task.priority,
                );

                return (
                    <Item key={task.id} variant="outline" size="sm">
                        <ItemMedia variant="icon">
                            {status?.icon && <status.icon />}
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle>
                                <Link
                                    href={tasksIndex()}
                                    className="truncate hover:underline"
                                >
                                    {task.title}
                                </Link>
                            </ItemTitle>
                            <ItemDescription>
                                {task.code}
                                {status && ` · ${t(status.label)}`}
                            </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                            {showOwner && task.owner && (
                                <Avatar className="size-6" title={task.owner}>
                                    <AvatarFallback className="text-[10px]">
                                        {initials(task.owner)}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                            {priority && (
                                <Badge variant="outline">
                                    {t(priority.label)}
                                </Badge>
                            )}
                        </ItemActions>
                    </Item>
                );
            })}
        </ItemGroup>
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
            className={cn(buttonVariants({ variant: 'outline' }))}
        >
            {label}
        </Link>
    );
}

// Up to two letters from a name, such as "Ada Lovelace" becomes "AL".
function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
