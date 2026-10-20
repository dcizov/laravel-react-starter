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
import { useTrans } from '@/hooks/use-trans';
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
    const t = useTrans();

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
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder={t('Settings section')}>
                            {(value: string) => {
                                const item = items.find(
                                    (entry) => toUrl(entry.href) === value,
                                );

                                return item ? t(item.title) : null;
                            }}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {items.map((item) => (
                            <SelectItem
                                key={toUrl(item.href)}
                                value={toUrl(item.href)}
                            >
                                {t(item.title)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <nav
                aria-label={t('Settings')}
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
                            {t(item.title)}
                        </Button>
                    );
                })}
            </nav>
        </>
    );
}
