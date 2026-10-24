import { Link } from '@inertiajs/react';
import { Bell, ChevronRight, Plus } from 'lucide-react';
import { Fragment } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { BreadcrumbItem } from '@/types';

export function AdminTopBar({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItem[];
}) {
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
                            const key = `${item.title}:${String(item.href)}`;

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
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Notifications"
                            disabled
                        >
                            <Bell className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Notifications arrive in a later step
                    </TooltipContent>
                </Tooltip>

                <ThemeToggle />

                <Button
                    size="sm"
                    className="ml-1 hidden gap-1.5 sm:inline-flex"
                    disabled
                >
                    <Plus className="size-4" />
                    New page
                </Button>
            </div>
        </header>
    );
}
