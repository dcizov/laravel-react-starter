'use client';

import {
    type ColumnDef,
    type ColumnFiltersState,
    type RowSelectionState,
    type SortingState,
    type Table as TableInstance,
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTrans } from '@/hooks/use-trans';

type DataTableProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    // Filters, search, and view options. Receives the table so it can read and change state.
    toolbar?: (table: TableInstance<TData>) => React.ReactNode;
    initialPageSize?: number;
    pageSizes?: number[];
    getRowId?: (row: TData, index: number) => string;
    enableRowSelection?: boolean;
    emptyMessage?: string;
};

// A reusable table with sorting, filtering (with facets), column visibility,
// row selection, and pagination. Columns and filters are provided by the caller.
export function DataTable<TData, TValue>({
    columns,
    data,
    toolbar,
    initialPageSize = 10,
    pageSizes = [10, 20, 30, 50],
    getRowId,
    enableRowSelection = true,
    emptyMessage,
}: DataTableProps<TData, TValue>) {
    const t = useTrans();
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
        {},
    );
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const table = useReactTable({
        data,
        columns,
        getRowId,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
        },
        initialState: {
            pagination: { pageIndex: 0, pageSize: initialPageSize },
        },
        enableRowSelection,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    return (
        <div className="flex flex-col gap-4">
            {toolbar?.(table)}

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
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext(),
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
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
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
