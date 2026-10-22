import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTable } from '@tanstack/react-table';
import type {
    ColumnDef,
    ColumnFiltersState,
    ColumnVisibilityState,
    OnChangeFn,
    PaginationState,
    RowData,
    RowSelectionState,
    SortingState,
} from '@tanstack/react-table';
import { AlertTriangle, GripVertical, SearchX } from 'lucide-react';
import * as React from 'react';
import { DataTableBulkActions } from '@/components/data-table/data-table-bulk-actions';
import type { DataTableBulkAction } from '@/components/data-table/data-table-bulk-actions';
import { dataTableFeatures } from '@/components/data-table/data-table-features';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { DataTableRowDetail } from '@/components/data-table/data-table-row-detail';
import type { DataTableDetail } from '@/components/data-table/data-table-row-detail';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import type { DataTableToolbarOptions } from '@/components/data-table/data-table-toolbar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

// Server mode: the page keeps the query (page, sort, search, filters) in the URL, and the server returns only the
// rows for that query. The table shows the state it is given and reports each change through onChange.
export type DataTableServerState = {
    // The rows that match the query, across all pages.
    total: number;
    pageCount: number;
    // 1-based page number, as the URL has it.
    page: number;
    perPage: number;
    // The column id the rows are sorted by, which must match a server sort key. Null when unsorted.
    sort: string | null;
    direction: 'asc' | 'desc';
    search: string;
    // Facet filters by column id. Each value is the list of options chosen.
    filters: Record<string, string[]>;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    onChange: (
        patch: Partial<{
            page: number;
            perPage: number;
            sort: string | null;
            direction: 'asc' | 'desc';
            search: string;
            filters: Record<string, string[]>;
        }>,
    ) => void;
};

type DataTableProps<TData extends RowData> = {
    columns: ColumnDef<DataTableFeatures, TData>[];
    data: TData[];
    // Search, filters, actions, and view options. Omit for the defaults (View menu only).
    toolbar?: DataTableToolbarOptions<TData>;
    initialPageSize?: number;
    pageSizes?: number[];
    getRowId?: (row: TData, index: number) => string;
    enableRowSelection?: boolean;
    // Actions for the selected rows. Shown in a bar when rows are selected. Destructive ones ask first.
    bulkActions?: DataTableBulkAction<TData>[];
    // Adds a grip column so rows can be dragged into a new order. The table shows the new order at once;
    // pass onRowOrderChange to save it. Pass getRowId so each row keeps its identity.
    enableRowDragging?: boolean;
    // Called with the full list of row ids in their new order after a drag. Use it to save the order.
    onRowOrderChange?: (ids: string[]) => void;
    // Builds the drawer for a row. Cells in columns with meta.detail open it when clicked.
    renderDetail?: (row: TData) => DataTableDetail | null;
    emptyMessage?: string;
    // Turns on server mode. Without it, the rows are sorted, filtered and paged in the browser.
    server?: DataTableServerState;
    // Shown above the table when the server mode cannot load the rows.
    errorTitle?: string;
    // Columns that start hidden. They stay available for filters, and the View menu can show them.
    hiddenColumns?: string[];
};

type UseDataTableOptions<TData extends RowData> = Pick<
    DataTableProps<TData>,
    'columns' | 'data' | 'getRowId' | 'enableRowSelection' | 'initialPageSize'
> & {
    server?: DataTableServerState;
    columnFilters: ColumnFiltersState;
    sorting: SortingState;
    pagination: PaginationState;
    onPaginationChange: OnChangeFn<PaginationState>;
    onSortingChange: OnChangeFn<SortingState>;
    onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
};

function useDataTable<TData extends RowData>(
    props: UseDataTableOptions<TData>,
    rowSelection: RowSelectionState,
    setRowSelection: OnChangeFn<RowSelectionState>,
    columnVisibility: ColumnVisibilityState,
    setColumnVisibility: OnChangeFn<ColumnVisibilityState>,
) {
    const server = props.server;

    return useTable({
        features: dataTableFeatures,
        data: props.data,
        columns: props.columns,
        getRowId: props.getRowId,
        state: {
            sorting: props.sorting,
            columnVisibility,
            rowSelection,
            columnFilters: props.columnFilters,
            pagination: props.pagination,
        },
        initialState: {
            pagination: { pageIndex: 0, pageSize: props.initialPageSize ?? 10 },
        },
        enableRowSelection: props.enableRowSelection ?? false,
        onRowSelectionChange: setRowSelection,
        onSortingChange: props.onSortingChange,
        onColumnFiltersChange: props.onColumnFiltersChange,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: props.onPaginationChange,
        // In server mode the rows already come sorted, filtered and paged from the server.
        manualSorting: Boolean(server),
        manualFiltering: Boolean(server),
        manualPagination: Boolean(server),
        pageCount: server?.pageCount,
        rowCount: server?.total,
    });
}

// The grip button that starts a drag. Only this element carries the drag listeners,
// so clicks on the rest of the row still reach the checkbox and the cells.
function DragHandle({ id }: { id: string }) {
    const t = useTrans();
    const { attributes, listeners } = useSortable({ id });

    return (
        <Button
            {...attributes}
            {...listeners}
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:bg-transparent"
        >
            <GripVertical className="size-3" />
            <span className="sr-only">{t('Drag to reorder')}</span>
        </Button>
    );
}

// A row that can be dragged vertically, as in the shadcn dashboard-01 block.
function SortableRow({
    id,
    selected,
    children,
}: {
    id: string;
    selected: boolean;
    children: React.ReactNode;
}) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id,
    });

    return (
        <TableRow
            ref={setNodeRef}
            data-state={selected && 'selected'}
            data-dragging={isDragging}
            className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
        >
            {children}
        </TableRow>
    );
}

// A reusable table with sorting, filtering (with facets), column visibility,
// row selection, bulk actions, optional row dragging, and pagination. Columns and the toolbar come from the caller.
// The same API serves a table of rows already in the page (client mode) and a table whose rows come from the server
// (server mode, see DataTableServerState).
export function DataTable<TData extends RowData>({
    columns,
    data,
    toolbar,
    initialPageSize = 10,
    pageSizes = [10, 20, 30, 50],
    getRowId,
    enableRowSelection = false,
    bulkActions,
    enableRowDragging = false,
    onRowOrderChange,
    renderDetail,
    emptyMessage,
    server,
    errorTitle,
    hiddenColumns,
}: DataTableProps<TData>) {
    const t = useTrans();

    // The row order the user has dragged into. It resets when the data prop changes.
    const [items, setItems] = React.useState(data);
    const [source, setSource] = React.useState(data);
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
        {},
    );
    const [columnVisibility, setColumnVisibility] =
        React.useState<ColumnVisibilityState>(() =>
            Object.fromEntries((hiddenColumns ?? []).map((id) => [id, false])),
        );
    const [clientFilters, setClientFilters] =
        React.useState<ColumnFiltersState>([]);
    const [clientSorting, setClientSorting] = React.useState<SortingState>([]);
    const [clientPagination, setClientPagination] =
        React.useState<PaginationState>({
            pageIndex: 0,
            pageSize: initialPageSize,
        });

    if (data !== source) {
        setSource(data);
        setItems(data);
        // A new set of rows (after a page change, for example) clears the selection.
        setRowSelection({});
    }

    const rowId = React.useCallback(
        (row: TData, index: number) =>
            getRowId ? getRowId(row, index) : String(index),
        [getRowId],
    );

    const allColumns = React.useMemo<ColumnDef<DataTableFeatures, TData>[]>(
        () =>
            enableRowDragging
                ? [
                      {
                          id: 'drag',
                          header: () => null,
                          cell: ({ row }) => <DragHandle id={row.id} />,
                          enableSorting: false,
                          enableHiding: false,
                      },
                      ...columns,
                  ]
                : columns,
        [columns, enableRowDragging],
    );

    // Server mode maps the query onto the table state. Search is kept locally so typing feels immediate, and sent
    // to the server after a short pause.
    const [searchDraft, setSearchDraft] = React.useState(server?.search ?? '');
    const serverSearch = server?.search ?? '';

    React.useEffect(() => {
        setSearchDraft(serverSearch);
    }, [serverSearch]);

    React.useEffect(() => {
        if (!server || searchDraft === serverSearch) {
            return;
        }

        const timer = window.setTimeout(() => {
            server.onChange({ search: searchDraft, page: 1 });
        }, 300);

        return () => window.clearTimeout(timer);
        // The server callback is recreated on each render; only the typed text should restart the pause.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchDraft, serverSearch]);

    const serverFilters = React.useMemo<ColumnFiltersState>(
        () =>
            server
                ? Object.entries(server.filters).map(([id, value]) => ({
                      id,
                      value,
                  }))
                : [],
        [server],
    );

    const serverSorting = React.useMemo<SortingState>(
        () =>
            server?.sort
                ? [{ id: server.sort, desc: server.direction === 'desc' }]
                : [],
        [server],
    );

    const serverPagination = React.useMemo<PaginationState>(
        () =>
            server
                ? { pageIndex: server.page - 1, pageSize: server.perPage }
                : { pageIndex: 0, pageSize: initialPageSize },
        [server, initialPageSize],
    );

    const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
        const next =
            typeof updater === 'function'
                ? updater(server ? serverSorting : clientSorting)
                : updater;

        if (!server) {
            setClientSorting(next);

            return;
        }

        const first = next[0];

        server.onChange({
            sort: first ? first.id : null,
            direction: first?.desc ? 'desc' : 'asc',
            page: 1,
        });
    };

    const handleFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
        const next =
            typeof updater === 'function'
                ? updater(server ? serverFilters : clientFilters)
                : updater;

        if (!server) {
            setClientFilters(next);

            return;
        }

        const filters: Record<string, string[]> = {};

        next.forEach((filter) => {
            if (Array.isArray(filter.value) && filter.value.length > 0) {
                filters[filter.id] = filter.value.map(String);
            }
        });

        server.onChange({ filters, page: 1 });
    };

    const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
        const next =
            typeof updater === 'function'
                ? updater(server ? serverPagination : clientPagination)
                : updater;

        if (!server) {
            setClientPagination(next);

            return;
        }

        server.onChange({ page: next.pageIndex + 1, perPage: next.pageSize });
    };

    const table = useDataTable(
        {
            columns: allColumns,
            data: items,
            getRowId,
            enableRowSelection,
            initialPageSize,
            server,
            columnFilters: server ? serverFilters : clientFilters,
            sorting: server ? serverSorting : clientSorting,
            pagination: server ? serverPagination : clientPagination,
            onSortingChange: handleSortingChange,
            onColumnFiltersChange: handleFiltersChange,
            onPaginationChange: handlePaginationChange,
        },
        rowSelection,
        setRowSelection,
        columnVisibility,
        setColumnVisibility,
    );

    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {}),
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const ids = items.map((row, index) => rowId(row, index));
        const from = ids.indexOf(String(active.id));
        const to = ids.indexOf(String(over.id));

        if (from < 0 || to < 0) {
            return;
        }

        const moved = arrayMove(items, from, to);

        setItems(moved);
        onRowOrderChange?.(moved.map((row, index) => rowId(row, index)));
    }

    const rows = table.getRowModel().rows;
    const rowIds = rows.map((row) => row.id);
    const loading = server?.loading ?? false;

    const renderCells = (row: (typeof rows)[number]) =>
        row.getVisibleCells().map((cell) => {
            const content = <table.FlexRender cell={cell} />;
            const detail =
                renderDetail && cell.column.columnDef.meta?.detail
                    ? renderDetail(row.original)
                    : null;

            return (
                <TableCell key={cell.id}>
                    {detail ? (
                        <DataTableRowDetail detail={detail}>
                            {content}
                        </DataTableRowDetail>
                    ) : (
                        content
                    )}
                </TableCell>
            );
        });

    const selectedRows = enableRowSelection
        ? table.getSelectedRowModel().rows.map((row) => row.original)
        : [];

    const toolbarSearch = server
        ? {
              value: searchDraft,
              onChange: (value: string) => setSearchDraft(value),
          }
        : undefined;

    return (
        <div className="flex flex-col gap-4" aria-busy={loading || undefined}>
            <DataTableToolbar
                table={table}
                options={toolbar ?? {}}
                search={toolbarSearch}
            />

            {server?.error && (
                <Alert variant="destructive">
                    <AlertTriangle />
                    <AlertTitle>
                        {errorTitle ?? t('The list could not be loaded.')}
                    </AlertTitle>
                    <AlertDescription className="flex flex-wrap items-center gap-3">
                        <span>{server.error}</span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => server.onRetry()}
                        >
                            {t('Try again')}
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {enableRowSelection && bulkActions && bulkActions.length > 0 && (
                <DataTableBulkActions
                    selected={selectedRows}
                    actions={bulkActions}
                    onDone={() => setRowSelection({})}
                />
            )}

            <div
                className={cn(
                    'overflow-hidden rounded-md border transition-opacity',
                    loading && 'opacity-60',
                )}
            >
                <DndContext
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                >
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
                                                <table.FlexRender
                                                    header={header}
                                                />
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {server && loading && rows.length === 0 ? (
                                Array.from({
                                    length: Math.min(server.perPage, 5),
                                }).map((_, index) => (
                                    <TableRow key={`skeleton-${index}`}>
                                        <TableCell colSpan={allColumns.length}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : rows.length ? (
                                enableRowDragging ? (
                                    <SortableContext
                                        items={rowIds}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {rows.map((row) => (
                                            <SortableRow
                                                key={row.id}
                                                id={row.id}
                                                selected={row.getIsSelected()}
                                            >
                                                {renderCells(row)}
                                            </SortableRow>
                                        ))}
                                    </SortableContext>
                                ) : (
                                    rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={
                                                row.getIsSelected() &&
                                                'selected'
                                            }
                                        >
                                            {renderCells(row)}
                                        </TableRow>
                                    ))
                                )
                            ) : server?.error ? null : (
                                <TableRow>
                                    <TableCell
                                        colSpan={allColumns.length}
                                        className="h-24 text-center"
                                    >
                                        <Empty className="p-0">
                                            <EmptyHeader>
                                                <EmptyMedia variant="icon">
                                                    <SearchX />
                                                </EmptyMedia>
                                                <EmptyTitle>
                                                    {emptyMessage ??
                                                        t('No results.')}
                                                </EmptyTitle>
                                            </EmptyHeader>
                                        </Empty>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DndContext>
            </div>

            <DataTablePagination
                table={table}
                pageSizes={pageSizes}
                showSelection={enableRowSelection}
                total={server?.total}
                disabled={loading}
            />
        </div>
    );
}
