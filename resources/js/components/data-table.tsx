import {
    columnFacetingFeature,
    columnFilteringFeature,
    columnVisibilityFeature,
    createFacetedRowModel,
    createFacetedUniqueValues,
    createFilteredRowModel,
    createPaginatedRowModel,
    createSortedRowModel,
    filterFn_includesString,
    flexRender,
    rowPaginationFeature,
    rowSelectionFeature,
    rowSortingFeature,
    sortFn_alphanumeric,
    sortFn_text,
    tableFeatures,
    useTable,
} from '@tanstack/react-table';
import type {
    Column,
    ColumnDef,
    ColumnFiltersState,
    ColumnVisibilityState,
    PaginationState,
    ReactTable,
    RowData,
    RowSelectionState,
    SortingState,
    Updater,
} from '@tanstack/react-table';
import {
    ArrowDown,
    ArrowUp,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronsUpDown,
    RotateCcw,
    Search,
    Settings2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * TanStack Table v9 registers features explicitly so unused row models are
 * tree-shaken out. Every table in the app shares this registry: sorting,
 * filtering, faceting, visibility, pagination and selection.
 */
export type DataTableColumnMeta = {
    /** Extra classes for the header and body cells of this column. */
    className?: string;
    /** Human label used by the column visibility menu. */
    label?: string;
};

export const dataTableFeatures = tableFeatures({
    columnMeta: {} as DataTableColumnMeta,
    columnFacetingFeature,
    columnFilteringFeature,
    columnVisibilityFeature,
    rowPaginationFeature,
    rowSelectionFeature,
    rowSortingFeature,
    facetedRowModel: createFacetedRowModel(),
    facetedUniqueValues: createFacetedUniqueValues(),
    filteredRowModel: createFilteredRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
    sortedRowModel: createSortedRowModel(),
    filterFns: { includesString: filterFn_includesString },
    sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

export type DataTableFeatures = typeof dataTableFeatures;

export type DataTableInstance<TData extends RowData> = ReactTable<
    DataTableFeatures,
    TData
>;

/** Column definitions must be typed against the shared feature registry. */
export type DataTableColumns<TData extends RowData> = ColumnDef<
    DataTableFeatures,
    TData
>[];

export type DataTableServerPagination = {
    /** Zero based, derived from Laravel's `current_page - 1`. */
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    total: number;
};

export type DataTableProps<TData extends RowData> = {
    columns: DataTableColumns<TData>;
    data: TData[];
    getRowId?: (row: TData) => string;
    rowClassName?: (row: TData) => string | undefined;
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    emptyState?: ReactNode;
    skeletonRows?: number;
    caption?: string;
    className?: string;
    /** Adds the selection column and the "n of m selected" summary. */
    enableRowSelection?: boolean;
    initialPageSize?: number;
    /**
     * Server-driven pagination. When present the table never slices `data`
     * itself: Laravel already paginated, so paging must round-trip to the
     * server through `onPageChange`.
     */
    serverPagination?: DataTableServerPagination;
    onPageChange?: (pageIndex: number) => void;
    /** Controlled sorting, e.g. from `?sort=` in the query string. */
    sorting?: SortingState;
    onSortingChange?: (sorting: SortingState) => void;
    /** Toolbar slot rendered above the table (filters, search, actions). */
    toolbar?: ReactNode;
    /** Shows the column visibility menu. Defaults to on. */
    columnsMenu?: boolean;
    /** Hides the footer entirely (short, unpaginated lists). */
    paginate?: boolean;
};

const skeletonKeys = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];

const pageSizeOptions = [10, 20, 25, 50, 100];

function applyUpdater<T>(updater: Updater<T>, previous: T): T {
    return typeof updater === 'function'
        ? (updater as (old: T) => T)(previous)
        : updater;
}

/**
 * The app's one data table.
 *
 * It owns the three universal states (loading skeleton, empty state, inline
 * error) and every interaction: sorting, filtering, column visibility,
 * selection and pagination. Both hosting modes are supported, because the
 * backend is the source of truth for big lists while small lists (activity,
 * taxonomy) fit in a single response:
 *
 * - client mode (default): TanStack sorts, filters and paginates `data`;
 * - server mode (`serverPagination`): Laravel paginated already, so paging and
 *   sorting call back into the page, which issues an Inertia visit.
 */
export function DataTable<TData extends RowData>({
    columns,
    data,
    getRowId,
    rowClassName,
    loading = false,
    error = null,
    onRetry,
    emptyState,
    skeletonRows = 5,
    caption,
    className,
    enableRowSelection = false,
    initialPageSize = 20,
    serverPagination,
    onPageChange,
    sorting,
    onSortingChange,
    toolbar,
    columnsMenu = true,
    paginate = true,
}: DataTableProps<TData>) {
    const [clientSorting, setClientSorting] = useState<SortingState>([]);
    const [clientPagination, setClientPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: initialPageSize,
    });
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] =
        useState<ColumnVisibilityState>({});
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const serverPage = serverPagination;
    const sortingState = sorting ?? clientSorting;
    const paginationState: PaginationState = serverPage
        ? { pageIndex: serverPage.pageIndex, pageSize: serverPage.pageSize }
        : clientPagination;

    const table = useTable({
        features: dataTableFeatures,
        data,
        columns,
        getRowId,
        state: {
            sorting: sortingState,
            pagination: paginationState,
            columnVisibility,
            columnFilters,
            rowSelection,
        },
        manualPagination: serverPage !== undefined,
        manualSorting: sorting !== undefined && onSortingChange !== undefined,
        manualFiltering: serverPage !== undefined,
        pageCount: serverPage?.pageCount,
        enableRowSelection,
        onRowSelectionChange: (updater) =>
            setRowSelection((previous) => applyUpdater(updater, previous)),
        onColumnVisibilityChange: (updater) =>
            setColumnVisibility((previous) => applyUpdater(updater, previous)),
        onColumnFiltersChange: (updater) =>
            setColumnFilters((previous) => applyUpdater(updater, previous)),
        onSortingChange: (updater) => {
            const next = applyUpdater(updater, sortingState);

            if (onSortingChange) {
                onSortingChange(next);

                return;
            }

            setClientSorting(next);
        },
        onPaginationChange: (updater) => {
            const next = applyUpdater(updater, paginationState);

            if (serverPage) {
                if (next.pageIndex !== serverPage.pageIndex) {
                    onPageChange?.(next.pageIndex);
                }

                return;
            }

            setClientPagination(next);
        },
    });

    if (error) {
        return <ErrorState message={error} onRetry={onRetry} />;
    }

    if (!loading && data.length === 0 && emptyState) {
        return <>{emptyState}</>;
    }

    const rows = table.getRowModel().rows;
    const columnCount = Math.max(
        1,
        table.getVisibleLeafColumns().length || columns.length,
    );
    const selectedCount = table.getFilteredSelectedRowModel().rows.length;
    const totalRows = serverPage
        ? serverPage.total
        : table.getFilteredRowModel().rows.length;
    const pageCount = Math.max(1, table.getPageCount());
    const pageIndex = table.state.pagination.pageIndex;

    const hideableColumns = table
        .getAllColumns()
        .filter((column) => column.getCanHide() && column.accessorFn);

    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {toolbar || (columnsMenu && hideableColumns.length > 1) ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        {toolbar}
                    </div>
                    {columnsMenu && hideableColumns.length > 1 ? (
                        <DataTableViewOptions table={table} />
                    ) : null}
                </div>
            ) : null}

            <div className="overflow-hidden rounded-lg border border-border bg-card">
                <Table>
                    {caption ? (
                        <TableCaption className="sr-only">
                            {caption}
                        </TableCaption>
                    ) : null}
                    <TableHeader className="bg-muted/40">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                                key={headerGroup.id}
                                className="hover:bg-transparent"
                            >
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        colSpan={header.colSpan}
                                        className={cn(
                                            header.column.columnDef.meta
                                                ?.className,
                                        )}
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
                        {loading ? (
                            skeletonKeys
                                .slice(0, skeletonRows)
                                .map((skeletonKey) => (
                                    <TableRow key={skeletonKey}>
                                        {table
                                            .getVisibleLeafColumns()
                                            .map((column, index) => (
                                                <TableCell
                                                    key={column.id}
                                                    className="py-3.5"
                                                >
                                                    <Skeleton
                                                        className={cn(
                                                            'h-4',
                                                            index === 0
                                                                ? 'w-44'
                                                                : 'w-20',
                                                        )}
                                                    />
                                                </TableCell>
                                            ))}
                                    </TableRow>
                                ))
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columnCount}
                                    className="h-24 text-center text-sm text-muted-foreground"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected()
                                            ? 'selected'
                                            : undefined
                                    }
                                    className={rowClassName?.(row.original)}
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
                        )}
                    </TableBody>
                </Table>
            </div>

            {paginate && !loading ? (
                <DataTablePagination
                    summary={
                        enableRowSelection
                            ? `${selectedCount} of ${totalRows} row(s) selected`
                            : `${totalRows} ${totalRows === 1 ? 'row' : 'rows'}`
                    }
                    pageIndex={pageIndex}
                    pageCount={pageCount}
                    pageSize={table.state.pagination.pageSize}
                    showPageSize={!serverPage}
                    canPrevious={table.getCanPreviousPage()}
                    canNext={table.getCanNextPage()}
                    onFirst={() => table.setPageIndex(0)}
                    onPrevious={() => table.previousPage()}
                    onNext={() => table.nextPage()}
                    onLast={() => table.setPageIndex(pageCount - 1)}
                    onPageSize={(size) => table.setPageSize(size)}
                />
            ) : null}
        </div>
    );
}

type DataTablePaginationProps = {
    summary: string;
    pageIndex: number;
    pageCount: number;
    pageSize: number;
    showPageSize: boolean;
    canPrevious: boolean;
    canNext: boolean;
    onFirst: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onLast: () => void;
    onPageSize: (size: number) => void;
};

/**
 * Shared footer for both hosting modes. In server mode the page size is fixed
 * by the controller, so the size selector is hidden rather than faked.
 */
export function DataTablePagination({
    summary,
    pageIndex,
    pageCount,
    pageSize,
    showPageSize,
    canPrevious,
    canNext,
    onFirst,
    onPrevious,
    onNext,
    onLast,
    onPageSize,
}: DataTablePaginationProps) {
    return (
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{summary}</p>

            <div className="flex flex-wrap items-center gap-4">
                {showPageSize ? (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Rows per page
                        </span>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(value) => onPageSize(Number(value))}
                        >
                            <SelectTrigger
                                className="h-8 w-[72px]"
                                aria-label="Rows per page"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {pageSizeOptions.map((option) => (
                                    <SelectItem
                                        key={option}
                                        value={String(option)}
                                    >
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : null}

                <p
                    className="text-sm font-medium text-muted-foreground"
                    aria-live="polite"
                >
                    Page {pageIndex + 1} of {pageCount}
                </p>

                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="hidden size-8 sm:flex"
                        onClick={onFirst}
                        disabled={!canPrevious}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={onPrevious}
                        disabled={!canPrevious}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={onNext}
                        disabled={!canNext}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="hidden size-8 sm:flex"
                        onClick={onLast}
                        disabled={!canNext}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

/**
 * Column visibility menu. Column ids double as labels unless a column sets
 * `meta.label`, so a column can stay readable without a second prop.
 */
export function DataTableViewOptions<TData extends RowData>({
    table,
}: {
    table: DataTableInstance<TData>;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                    <Settings2 className="size-3.5" />
                    Columns
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
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
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                                column.toggleVisibility(!!value)
                            }
                        >
                            {column.columnDef.meta?.label ??
                                column.id.replaceAll('_', ' ')}
                        </DropdownMenuCheckboxItem>
                    ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Sortable header driven by TanStack state. Works for client-side tables and
 * for server tables once `sorting`/`onSortingChange` are wired up.
 */
export function DataTableColumnHeader<TData extends RowData, TValue>({
    column,
    title,
    className,
}: {
    column: Column<DataTableFeatures, TData, TValue>;
    title: string;
    className?: string;
}) {
    if (!column.getCanSort()) {
        return <div className={cn(className)}>{title}</div>;
    }

    const sorted = column.getIsSorted();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        '-ml-2 h-8 gap-1.5 px-2 text-xs font-medium tracking-wide uppercase data-[state=open]:bg-accent',
                        className,
                    )}
                >
                    {title}
                    {sorted === 'desc' ? (
                        <ArrowDown className="size-3.5" />
                    ) : sorted === 'asc' ? (
                        <ArrowUp className="size-3.5" />
                    ) : (
                        <ChevronsUpDown className="size-3.5 opacity-60" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                    <ArrowUp className="size-3.5" />
                    Ascending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                    <ArrowDown className="size-3.5" />
                    Descending
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => column.toggleVisibility(false)}
                >
                    <X className="size-3.5" />
                    Hide column
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Server-defined sort token. Laravel only accepts one direction per field
 * (`?sort=title` is ascending, `?sort=updated` descending), so the button
 * advertises the direction it will request instead of offering a fake choice.
 */
export function DataTableSortButton({
    label,
    active,
    direction,
    onSort,
    className,
}: {
    label: string;
    active: boolean;
    direction: 'asc' | 'desc';
    onSort: () => void;
    className?: string;
}) {
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={onSort}
            aria-pressed={active}
            className={cn(
                '-ml-2 h-8 gap-1.5 px-2 text-xs font-medium tracking-wide uppercase',
                active ? 'text-foreground' : 'text-muted-foreground',
                className,
            )}
        >
            {label}
            {active ? (
                direction === 'asc' ? (
                    <ArrowUp className="size-3.5" />
                ) : (
                    <ArrowDown className="size-3.5" />
                )
            ) : (
                <ChevronsUpDown className="size-3.5 opacity-50" />
            )}
        </Button>
    );
}

/**
 * Server-backed search box. The value is submitted on Enter or on blur-free
 * button use; typing never round-trips, which keeps Inertia visits down to one
 * per search.
 */
export function DataTableSearch({
    defaultValue = '',
    placeholder = 'Search',
    onSearch,
    className,
}: {
    defaultValue?: string;
    placeholder?: string;
    onSearch: (value: string) => void;
    className?: string;
}) {
    const [value, setValue] = useState(defaultValue);

    return (
        <form
            className={cn('relative', className)}
            onSubmit={(event) => {
                event.preventDefault();
                onSearch(value.trim());
            }}
            role="search"
        >
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="h-9 w-full pr-8 pl-8 sm:w-60"
            />
            {value !== '' ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
                    onClick={() => {
                        setValue('');
                        onSearch('');
                    }}
                >
                    <span className="sr-only">Clear search</span>
                    <X className="size-3.5" />
                </Button>
            ) : null}
        </form>
    );
}

/**
 * Segmented server-side filter with counts, e.g. page status or post status.
 * Values stay literal strings: the backend validates them.
 */
export function DataTableFilterTabs({
    value,
    options,
    onChange,
    className,
}: {
    value: string;
    options: { value: string; label: string; count?: number }[];
    onChange: (value: string) => void;
    className?: string;
}) {
    return (
        <div
            className={cn('flex flex-wrap items-center gap-1', className)}
            role="group"
            aria-label="Filters"
        >
            {options.map((option) => {
                const active = option.value === value;

                return (
                    <Button
                        key={option.label}
                        size="sm"
                        variant={active ? 'secondary' : 'ghost'}
                        aria-pressed={active}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                        {option.count !== undefined ? (
                            <span
                                className={cn(
                                    'ml-1 text-xs',
                                    active
                                        ? 'text-foreground/70'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {option.count}
                            </span>
                        ) : null}
                    </Button>
                );
            })}
        </div>
    );
}

/**
 * Toolbar layout used by every list: filters on the left, search and utilities
 * on the right. It is layout only; behaviour comes from the components above.
 */
export function DataTableToolbar({
    filters,
    children,
    className,
}: {
    filters?: ReactNode;
    children?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
                className,
            )}
        >
            <div className="flex flex-wrap items-center gap-2">{filters}</div>
            <div className="flex flex-wrap items-center gap-2">{children}</div>
        </div>
    );
}

/**
 * Optional "reset everything" affordance shown when a list is filtered.
 */
export function DataTableResetButton({
    onReset,
    label = 'Reset',
}: {
    onReset: () => void;
    label?: string;
}) {
    return (
        <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="size-3.5" />
            {label}
        </Button>
    );
}
