import { Link, usePage } from '@inertiajs/react';
import { ChevronRight, Plus } from 'lucide-react';
import { Fragment } from 'react';
import { useBreadcrumbItems } from '@/components/breadcrumbs-context';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { hrefToString } from '@/lib/url';

export function AdminTopBar() {
    const breadcrumbs = useBreadcrumbItems();

    return (
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <SidebarTrigger className="-ml-1" />

            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
                <ol className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                    {breadcrumbs.length === 0 ? (
                        <li className="font-medium text-foreground">Admin</li>
                    ) : (
                        breadcrumbs.map((item, index) => {
                            const isLast = index === breadcrumbs.length - 1;
                            const key = `${item.title}:${hrefToString(item.href)}`;

                            return (
                                <Fragment key={key}>
                                    {index > 0 ? (
                                        <ChevronRight className="size-3.5 opacity-50" />
                                    ) : null}
                                    <li className="truncate">
                                        {isLast ? (
                                            <span className="font-medium text-foreground">
                                                {item.title}
                                            </span>
                                        ) : (
                                            <Link
                                                href={item.href}
                                                className="transition-colors hover:text-foreground"
                                            >
                                                {item.title}
                                            </Link>
                                        )}
                                    </li>
                                </Fragment>
                            );
                        })
                    )}
                </ol>
            </nav>

            <div className="flex items-center gap-1">
                <NotificationBell />

                <ThemeToggle />

                <NewPageButton />
            </div>
        </header>
    );
}

/**
 * The top bar is shared by every admin screen, so its primary action is too:
 * it appears only for people allowed to create pages.
 */
function NewPageButton() {
    const { auth } = usePage().props;

    if (!auth.user || !auth.can?.['pages.create']) {
        return null;
    }

    return (
        <Button
            size="sm"
            className="ml-1 hidden gap-1.5 sm:inline-flex"
            asChild
        >
            <Link href="/admin/pages/create">
                <Plus className="size-4" />
                New page
            </Link>
        </Button>
    );
}
