import type { ReactTable } from '@tanstack/react-table';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import { X } from 'lucide-react';
import { DataTableFacetedFilter } from '@/components/data-table/data-table-faceted-filter';
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options';
import { priorities, statuses, type Task } from '@/components/tasks/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrans } from '@/hooks/use-trans';

// Filters above the task table: title search, status and priority facets, and column visibility.
export function TasksToolbar({
    table,
}: {
    table: ReactTable<DataTableFeatures, Task>;
}) {
    const t = useTrans();
    const filtered = table.state.columnFilters.length > 0;

    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
                <Input
                    placeholder={t('Filter tasks...')}
                    value={
                        (table
                            .getColumn('title')
                            ?.getFilterValue() as string) ?? ''
                    }
                    onChange={(event) =>
                        table
                            .getColumn('title')
                            ?.setFilterValue(event.target.value)
                    }
                    className="h-8 w-[150px] lg:w-[250px]"
                />
                <div className="flex gap-x-2">
                    {table.getColumn('status') && (
                        <DataTableFacetedFilter
                            column={table.getColumn('status')}
                            title={t('Status')}
                            options={statuses.map((status) => ({
                                ...status,
                                label: t(status.label),
                            }))}
                        />
                    )}
                    {table.getColumn('priority') && (
                        <DataTableFacetedFilter
                            column={table.getColumn('priority')}
                            title={t('Priority')}
                            options={priorities.map((priority) => ({
                                ...priority,
                                label: t(priority.label),
                            }))}
                        />
                    )}
                </div>
                {filtered && (
                    <Button
                        variant="ghost"
                        onClick={() => table.resetColumnFilters()}
                        className="h-8 px-2 lg:px-3"
                    >
                        {t('Reset')}
                        <X />
                    </Button>
                )}
            </div>
            <DataTableViewOptions table={table} />
        </div>
    );
}
