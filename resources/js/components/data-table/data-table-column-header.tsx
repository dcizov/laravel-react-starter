import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

// A column title that opens a menu to sort ascending or descending, or hide the column.
export function DataTableColumnHeader<TData, TValue>({
    column,
    title,
    className,
}: {
    column: Column<TData, TValue>;
    title: string;
    className?: string;
}) {
    const t = useTrans();

    if (!column.getCanSort()) {
        return <div className={cn(className)}>{title}</div>;
    }

    const sorted = column.getIsSorted();

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-3 h-8 data-[popup-open]:bg-accent"
                        />
                    }
                >
                    <span>{title}</span>
                    {sorted === 'desc' ? (
                        <ArrowDown />
                    ) : sorted === 'asc' ? (
                        <ArrowUp />
                    ) : (
                        <ChevronsUpDown />
                    )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem
                        onClick={() => column.toggleSorting(false)}
                    >
                        <ArrowUp />
                        {t('Ascending')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => column.toggleSorting(true)}
                    >
                        <ArrowDown />
                        {t('Descending')}
                    </DropdownMenuItem>
                    {column.getCanHide() && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => column.toggleVisibility(false)}
                            >
                                <EyeOff />
                                {t('Hide')}
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
