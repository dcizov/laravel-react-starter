import { useTable } from '@tanstack/react-table';
import type {
    ColumnDef,
    ColumnFiltersState,
    ColumnVisibilityState,
    RowData,
    RowSelectionState,
    SortingState,
} from '@tanstack/react-table';
import * as React from 'react';
import { dataTableFeatures } from '@/components/data-table/data-table-features';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import type { DataTableToolbarOptions } from '@/components/data-table/data-table-toolbar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTrans } from '@/hooks/use-trans';

type DataTableProps<TData extends RowData> = {
    columns: ColumnDef<DataTableFeatures, TData>[];
    data: TData[];
    // Search, filters, actions, and view options. Omit for the defaults (View menu only).
    toolbar?: DataTableToolbarOptions<TData>;
    initialPageSize?: number;
    pageSizes?: number[];
    getRowId?: (row: TData, index: number) => string;
    enableRowSelection?: boolean;
    emptyMessage?: string;
};

type UseDataTableOptions<TData extends RowData> = Pick<
    DataTableProps<TData>,
    'columns' | 'data' | 'getRowId' | 'enableRowSelection' | 'initialPageSize'
>;

function useDataTable<TData extends RowData>(
    props: UseDataTableOptions<TData>,
) {
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
        {},
    );
    const [columnVisibility, setColumnVisibility] =
        React.useState<ColumnVisibilityState>({});
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);

    return useTable({
        features: dataTableFeatures,
        data: props.data,
        columns: props.columns,
        getRowId: props.getRowId,
        state: { sorting, columnVisibility, rowSelection, columnFilters },
        initialState: {
            pagination: { pageIndex: 0, pageSize: props.initialPageSize ?? 10 },
        },
        enableRowSelection: props.enableRowSelection ?? true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
    });
}

// A reusable table with sorting, filtering (with facets), column visibility,
// row selection, and pagination. Columns and the toolbar come from the caller.
export function DataTable<TData extends RowData>({
    columns,
    data,
    toolbar,
    initialPageSize = 10,
    pageSizes = [10, 20, 30, 50],
    getRowId,
    enableRowSelection = true,
    emptyMessage,
}: DataTableProps<TData>) {
    const t = useTrans();
    const table = useDataTable({
        columns,
        data,
        getRowId,
        enableRowSelection,
        initialPageSize,
    });

    return (
        <div className="flex flex-col gap-4">
            <DataTableToolbar table={table} options={toolbar ?? {}} />

            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        colSpan={header.colSpan}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <table.FlexRender header={header} />
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && 'selected'
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            <table.FlexRender cell={cell} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    {emptyMessage ?? t('No results.')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination table={table} pageSizes={pageSizes} />
        </div>
    );
}
