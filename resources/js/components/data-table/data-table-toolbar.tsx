import type { ReactTable, RowData } from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import type * as React from 'react';
import { DataTableFacetedFilter } from '@/components/data-table/data-table-faceted-filter';
import type { FacetOption } from '@/components/data-table/data-table-faceted-filter';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options';
import { Button } from '@/components/ui/button';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import { useTrans } from '@/hooks/use-trans';

// A faceted filter above the table. `column` is the column id it filters.
export type DataTableFilter = {
    column: string;
    title: string;
    options: FacetOption[];
};

// What the toolbar shows. Every part is optional, so a table only gets the controls it needs.
// Labels and placeholders are passed already translated.
export type DataTableToolbarOptions<TData extends RowData> = {
    // A text box that filters one column, usually the name.
    search?: { column: string; placeholder: string };
    // Facet filters, shown as dashed buttons with option counts.
    filters?: DataTableFilter[];
    // Buttons on the right, such as "Create task". Receives the table.
    actions?: (table: ReactTable<DataTableFeatures, TData>) => React.ReactNode;
    // The View menu that shows and hides columns. On by default.
    viewOptions?: boolean;
};

// The row of controls above a DataTable. Reads its config and the table state.
export function DataTableToolbar<TData extends RowData>({
    table,
    options,
}: {
    table: ReactTable<DataTableFeatures, TData>;
    options: DataTableToolbarOptions<TData>;
}) {
    const t = useTrans();
    const searchColumn = options.search
        ? table.getColumn(options.search.column)
        : undefined;
    const filtered = table.state.columnFilters.length > 0;
    const showViewOptions = options.viewOptions ?? true;

    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
                {options.search && searchColumn && (
                    <InputGroup className="h-8 w-[150px] lg:w-[250px]">
                        <InputGroupInput
                            placeholder={options.search.placeholder}
                            value={
                                (searchColumn.getFilterValue() as string) ?? ''
                            }
                            onChange={(event) =>
                                searchColumn.setFilterValue(event.target.value)
                            }
                        />
                        <InputGroupAddon>
                            <Search />
                        </InputGroupAddon>
                        {(searchColumn.getFilterValue() as string) && (
                            <InputGroupAddon align="inline-end">
                                <InputGroupButton
                                    size="icon-xs"
                                    aria-label={t('Clear search')}
                                    onClick={() =>
                                        searchColumn.setFilterValue('')
                                    }
                                >
                                    <X />
                                </InputGroupButton>
                            </InputGroupAddon>
                        )}
                    </InputGroup>
                )}
                {options.filters && options.filters.length > 0 && (
                    <div className="flex gap-x-2">
                        {options.filters.map((filter) => {
                            const column = table.getColumn(filter.column);

                            return column ? (
                                <DataTableFacetedFilter
                                    key={filter.column}
                                    column={column}
                                    title={filter.title}
                                    options={filter.options}
                                />
                            ) : null;
                        })}
                    </div>
                )}
                {filtered && (
                    <Button
                        variant="ghost"
                        onClick={() => table.resetColumnFilters()}
                        size="sm"
                        className="px-2 lg:px-3"
                    >
                        {t('Reset')}
                        <X />
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-2">
                {options.actions?.(table)}
                {showViewOptions && <DataTableViewOptions table={table} />}
            </div>
        </div>
    );
}
