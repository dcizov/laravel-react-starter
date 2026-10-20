import { Link } from '@inertiajs/react';
import { Bell, CircleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTrans } from '@/hooks/use-trans';
import { edit as editNotifications } from '@/routes/notifications';

// Placeholder data until notifications are implemented. Replace this list
// with the real feed when the backend exists.
const sampleNotifications = [
    {
        id: 'sample-welcome',
        title: 'Welcome to the starter kit',
        body: 'Explore the sidebar and display settings.',
        time: 'Just now',
    },
    {
        id: 'sample-profile',
        title: 'Complete your profile',
        body: 'Add a job title and a bio to your profile.',
        time: '1 hour ago',
    },
];

export function NotificationsDropdown() {
    const t = useTrans();
    const count = sampleNotifications.length;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative"
                        aria-label={t('Notifications')}
                        data-test="notifications-trigger"
                    />
                }
            >
                <Bell />
                {count > 0 && (
                    <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
                )}
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="flex items-center justify-between gap-2 p-2">
                    <span className="flex items-center gap-2">
                        {t('Notifications')}
                        <Badge variant="secondary">
                            {t('Under construction')}
                        </Badge>
                    </span>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    {sampleNotifications.map((item) => (
                        <DropdownMenuItem
                            key={item.id}
                            className="flex items-start gap-3 py-2"
                        >
                            <CircleAlert className="mt-0.5 text-muted-foreground" />
                            <div className="grid min-w-0 gap-0.5">
                                <span className="text-sm font-medium">
                                    {t(item.title)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {t(item.body)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {t(item.time)}
                                </span>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    render={<Link href={editNotifications()} prefetch />}
                >
                    {t('Notification settings')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
