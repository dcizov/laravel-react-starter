import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

type SettingsSidebarNavProps = {
    items: NavItem[];
    className?: string;
};

export default function SettingsSidebarNav({
    items,
    className,
}: SettingsSidebarNavProps) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    const activeItem = items.find((item) => isCurrentOrParentUrl(item.href));
    const activeValue = activeItem ? toUrl(activeItem.href) : undefined;

    return (
        <>
            <div className="md:hidden">
                <Select
                    value={activeValue}
                    onValueChange={(value) => {
                        if (value && value !== activeValue) {
                            router.visit(value, { preserveScroll: true });
                        }
                    }}
                >
                    <SelectTrigger className="h-10 w-full sm:w-48">
                        <SelectValue placeholder="Settings section">
                            {(value: string) =>
                                items.find((item) => toUrl(item.href) === value)
                                    ?.title ?? null
                            }
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {items.map((item) => (
                            <SelectItem
                                key={toUrl(item.href)}
                                value={toUrl(item.href)}
                            >
                                {item.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <nav
                aria-label="Settings"
                className={cn('hidden flex-col space-y-1 md:flex', className)}
            >
                {items.map((item) => {
                    const isActive = activeItem === item;

                    return (
                        <Button
                            key={toUrl(item.href)}
                            size="sm"
                            variant="ghost"
                            render={<Link href={item.href} />}
                            nativeButton={false}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn('w-full justify-start', {
                                'bg-muted': isActive,
                            })}
                        >
                            {item.icon && <item.icon className="h-4 w-4" />}
                            {item.title}
                        </Button>
                    );
                })}
            </nav>
        </>
    );
}
