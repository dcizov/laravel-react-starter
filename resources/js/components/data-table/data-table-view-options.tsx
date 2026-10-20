import type { RowData, Table } from '@tanstack/react-table';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTrans } from '@/hooks/use-trans';

declare module '@tanstack/react-table' {
    // The label shown in the View menu for a column.
    interface ColumnMeta<TData extends RowData, TValue> {
        label?: string;
    }
}

// Shows or hides columns. Columns that cannot be hidden are left out.
export function DataTableViewOptions<TData>({
    table,
}: {
    table: Table<TData>;
}) {
    const t = useTrans();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto hidden h-8 lg:flex"
                    />
                }
            >
                <Settings2 />
                {t('View')}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[170px]">
                <DropdownMenuLabel>{t('Toggle columns')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                    .getAllColumns()
                    .filter(
                        (column) =>
                            typeof column.accessorFn !== 'undefined' &&
                            column.getCanHide(),
                    )
                    .map((column) => (
                        <DropdownMenuCheckboxItem
                            key={column.id}
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                                column.toggleVisibility(!!value)
                            }
                        >
                            {t(column.columnDef.meta?.label ?? column.id)}
                        </DropdownMenuCheckboxItem>
                    ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
