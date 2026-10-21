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
    RowData,
    RowSelectionState,
    SortingState,
} from '@tanstack/react-table';
import { GripVertical, SearchX } from 'lucide-react';
import * as React from 'react';
import { dataTableFeatures } from '@/components/data-table/data-table-features';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { DataTableRowDetail } from '@/components/data-table/data-table-row-detail';
import type { DataTableDetail } from '@/components/data-table/data-table-row-detail';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import type { DataTableToolbarOptions } from '@/components/data-table/data-table-toolbar';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
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
    // Adds a grip column so rows can be dragged into a new order. The table shows the new order at once;
    // pass onRowOrderChange to save it. Pass getRowId so each row keeps its identity.
    enableRowDragging?: boolean;
    // Called with the full list of row ids in their new order after a drag. Use it to save the order.
    onRowOrderChange?: (ids: string[]) => void;
    // Builds the drawer for a row. Cells in columns with meta.detail open it when clicked.
    renderDetail?: (row: TData) => DataTableDetail | null;
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
// row selection, optional row dragging, and pagination. Columns and the toolbar come from the caller.
export function DataTable<TData extends RowData>({
    columns,
    data,
    toolbar,
    initialPageSize = 10,
    pageSizes = [10, 20, 30, 50],
    getRowId,
    enableRowSelection = true,
    enableRowDragging = false,
    onRowOrderChange,
    renderDetail,
    emptyMessage,
}: DataTableProps<TData>) {
    const t = useTrans();

    // The row order the user has dragged into. It resets when the data prop changes.
    const [items, setItems] = React.useState(data);
    const [source, setSource] = React.useState(data);

    if (data !== source) {
        setSource(data);
        setItems(data);
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

    const table = useDataTable({
        columns: allColumns,
        data: items,
        getRowId,
        enableRowSelection,
        initialPageSize,
    });

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

    return (
        <div className="flex flex-col gap-4">
            <DataTableToolbar table={table} options={toolbar ?? {}} />

            <div className="overflow-hidden rounded-md border">
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
                            {rows.length ? (
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
                            ) : (
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

            <DataTablePagination table={table} pageSizes={pageSizes} />
        </div>
    );
}
