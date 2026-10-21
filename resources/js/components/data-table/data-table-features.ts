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
    rowPaginationFeature,
    rowSelectionFeature,
    rowSortingFeature,
    sortFn_alphanumeric,
    sortFn_text,
    tableFeatures,
} from '@tanstack/react-table';
import type { CellData, RowData, TableFeatures } from '@tanstack/table-core';

// TanStack Table v9 is feature based. Only the features listed here are included in the bundle.
// Every DataTable, column, and toolbar component shares this object, so they all agree on the APIs.
export const dataTableFeatures = tableFeatures({
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

// Pass this as the first generic of ColumnDef, Column, and ReactTable.
export type DataTableFeatures = typeof dataTableFeatures;

declare module '@tanstack/table-core' {
    // The generics must match the library's ColumnMeta declaration, even though this body does not use them.
    /* eslint-disable @typescript-eslint/no-unused-vars */
    interface ColumnMeta<
        TFeatures extends TableFeatures,
        TData extends RowData,
        TValue extends CellData,
    > {
        // The label shown in the View menu. It is translated where it is rendered.
        label?: string;
        // Makes this column's cell open the row's detail drawer (see DataTable renderDetail).
        detail?: boolean;
    }
    /* eslint-enable @typescript-eslint/no-unused-vars */
}
