import { router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type NotificationRow = {
    id: string;
    title: string;
    body: string;
    url: string | null;
    level: string;
    read: boolean;
    created_at: string | null;
    read_url: string;
};

export type NotificationsProp = {
    items: NotificationRow[];
    unread: number;
    read_all_url: string;
};

/**
 * In-app notifications. The rows are a deferred shared prop, so the bell paints
 * immediately with a skeleton and fills in on the second round trip — and an
 * empty bell is a normal state, not an error.
 */
export function NotificationBell() {
    const { notifications } = usePage<{ notifications?: NotificationsProp | null }>().props;

    const loading = notifications === undefined;
    const items = notifications?.items ?? [];
    const unread = notifications?.unread ?? 0;

    const refresh = () => router.reload({ only: ['notifications'] });

    const open = (item: NotificationRow) => {
        router.post(
            item.read_url,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    if (item.url) {
                        router.visit(item.url);
                    } else {
                        refresh();
                    }
                },
            },
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative size-8" aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}>
                    <Bell className="size-4" />
                    {unread > 0 ? (
                        <span className="bg-status-error absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full text-[9px] font-semibold text-white">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between gap-2">
                    <span>Notifications</span>
                    {unread > 0 && notifications ? (
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px] font-normal"
                            onClick={() =>
                                router.post(notifications.read_all_url, {}, { preserveScroll: true, onSuccess: refresh })
                            }
                        >
                            <CheckCheck className="size-3.5" />
                            Mark all read
                        </button>
                    ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {loading ? (
                    <div className="space-y-2 p-2" aria-busy="true" aria-label="Loading notifications">
                        {[0, 1, 2].map((row) => (
                            <div key={row} className="flex gap-2">
                                <Skeleton className="size-2 rounded-full" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-3 w-2/3" />
                                    <Skeleton className="h-2.5 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <p className="text-muted-foreground px-3 py-6 text-center text-xs">You’re all caught up.</p>
                ) : (
                    items.map((item) => (
                        <DropdownMenuItem
                            key={item.id}
                            className="flex cursor-pointer items-start gap-2 py-2"
                            onSelect={() => open(item)}
                        >
                            <span
                                className={cn(
                                    'mt-1.5 size-1.5 shrink-0 rounded-full',
                                    item.read ? 'bg-transparent' : item.level === 'error' ? 'bg-status-error' : 'bg-primary',
                                )}
                            />
                            <span className="min-w-0 flex-1">
                                <span className={cn('block truncate text-xs', item.read ? 'text-muted-foreground' : 'font-medium')}>
                                    {item.title}
                                </span>
                                {item.body ? <span className="text-muted-foreground block text-[11px]">{item.body}</span> : null}
                            </span>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
