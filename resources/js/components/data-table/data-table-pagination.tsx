import type { ReactTable, RowData } from '@tanstack/react-table';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTrans } from '@/hooks/use-trans';

// Selection summary, rows per page, and page controls for a DataTable.
export function DataTablePagination<TData extends RowData>({
    table,
    pageSizes,
}: {
    table: ReactTable<DataTableFeatures, TData>;
    pageSizes: number[];
}) {
    const t = useTrans();
    const selected = table.getFilteredSelectedRowModel().rows.length;
    const total = table.getFilteredRowModel().rows.length;
    const { pageIndex, pageSize } = table.state.pagination;

    return (
        <div className="flex items-center justify-between px-2">
            <div className="flex-1 text-sm text-muted-foreground">
                {t(':selected of :total row(s) selected.', { selected, total })}
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">{t('Rows per page')}</p>
                    <Select
                        value={`${pageSize}`}
                        onValueChange={(value) => {
                            if (value) {
                                table.setPageSize(Number(value));
                            }
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {pageSizes.map((size) => (
                                <SelectItem key={size} value={`${size}`}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[120px] items-center justify-center text-sm font-medium">
                    {t('Page :page of :pages', {
                        page: pageIndex + 1,
                        pages: Math.max(table.getPageCount(), 1),
                    })}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="hidden size-8 lg:flex"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">{t('Go to first page')}</span>
                        <ChevronsLeft />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">
                            {t('Go to previous page')}
                        </span>
                        <ChevronLeft />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">{t('Go to next page')}</span>
                        <ChevronRight />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="hidden size-8 lg:flex"
                        onClick={() =>
                            table.setPageIndex(table.getPageCount() - 1)
                        }
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">{t('Go to last page')}</span>
                        <ChevronsRight />
                    </Button>
                </div>
            </div>
        </div>
    );
}
