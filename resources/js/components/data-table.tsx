import type { ReactNode } from 'react';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type DataTableColumn<Row> = {
    key: string;
    header: ReactNode;
    className?: string;
    cell: (row: Row) => ReactNode;
};

export type DataTableProps<Row> = {
    columns: DataTableColumn<Row>[];
    rows: Row[];
    rowKey: (row: Row) => string | number;
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    emptyState?: ReactNode;
    skeletonRows?: number;
    className?: string;
    caption?: string;
};

const defaultSkeletonWidths = ['w-40', 'w-20', 'w-24', 'w-16', 'w-12'];

const skeletonKeys = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];

/**
 * Presentational table with the three required states:
 * skeleton rows sized to the columns, a specific empty state and an inline error.
 */
export function DataTable<Row>({
    columns,
    rows,
    rowKey,
    loading = false,
    error = null,
    onRetry,
    emptyState,
    skeletonRows = 5,
    className,
    caption,
}: DataTableProps<Row>) {
    if (error) {
        return <ErrorState message={error} onRetry={onRetry} />;
    }

    if (!loading && rows.length === 0 && emptyState) {
        return <>{emptyState}</>;
    }

    return (
        <div
            className={cn(
                'overflow-hidden rounded-lg border border-border bg-card',
                className,
            )}
        >
            <div className="overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                    {caption ? (
                        <caption className="sr-only">{caption}</caption>
                    ) : null}
                    <thead className="bg-muted/40">
                        <tr className="border-b border-border">
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    scope="col"
                                    className={cn(
                                        'px-4 py-2.5 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase',
                                        column.className,
                                    )}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? skeletonKeys
                                  .slice(0, skeletonRows)
                                  .map((skeletonKey) => (
                                      <tr
                                          key={skeletonKey}
                                          className="border-b border-border/60 last:border-0"
                                      >
                                          {columns.map(
                                              (column, columnIndex) => (
                                                  <td
                                                      key={column.key}
                                                      className={cn(
                                                          'px-4 py-3',
                                                          column.className,
                                                      )}
                                                  >
                                                      <Skeleton
                                                          className={cn(
                                                              'h-4',
                                                              defaultSkeletonWidths[
                                                                  columnIndex %
                                                                      defaultSkeletonWidths.length
                                                              ],
                                                          )}
                                                      />
                                                  </td>
                                              ),
                                          )}
                                      </tr>
                                  ))
                            : rows.map((row) => (
                                  <tr
                                      key={rowKey(row)}
                                      className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                                  >
                                      {columns.map((column) => (
                                          <td
                                              key={column.key}
                                              className={cn(
                                                  'px-4 py-3 align-middle',
                                                  column.className,
                                              )}
                                          >
                                              {column.cell(row)}
                                          </td>
                                      ))}
                                  </tr>
                              ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export { EmptyState };
