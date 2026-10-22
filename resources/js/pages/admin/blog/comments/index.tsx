import { Head, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Check, ShieldAlert, Trash2 } from 'lucide-react';
import * as React from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import type { DataTableBulkAction } from '@/components/data-table/data-table-bulk-actions';
import { useServerTable } from '@/components/data-table/use-server-table';
import type { ServerTableQuery } from '@/components/data-table/use-server-table';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDateTime } from '@/components/users/data';
import { useTrans } from '@/hooks/use-trans';

type Comment = {
    id: number;
    author: string;
    email: string | null;
    body: string;
    status: 'pending' | 'approved' | 'spam';
    createdAt: string | null;
    entry: { title: string; slug: string; type: string } | null;
};

type Paginated<T> = {
    data: T[];
    total: number;
    last_page: number;
    per_page: number;
    current_page: number;
};

type Status = 'pending' | 'approved' | 'spam';

// Comments waiting for moderation, approved, or marked as spam. Search, type, sorting and paging are server-side.
export default function AdminComments({
    comments,
    query,
    counts,
    types,
    pageSizes,
}: {
    comments: Paginated<Comment>;
    query: ServerTableQuery & { status: Status; type: string | null };
    counts: Record<Status, number>;
    types: { key: string; label: string }[];
    pageSizes: number[];
}) {
    const t = useTrans();
    const { timezone } = usePage().props;
    const url = '/admin/blog/comments';

    const { serverState, visit } = useServerTable({
        url,
        query,
        only: ['comments', 'counts', 'query', 'status', 'type'],
        filterKeys: ['type'],
    });

    const tabs: { key: Status; label: string }[] = [
        { key: 'pending', label: t('Waiting') },
        { key: 'approved', label: t('Approved') },
        { key: 'spam', label: t('Spam') },
    ];

    const setStatus = (id: number, status: Status) => {
        router.patch(`${url}/${id}`, { status }, { preserveScroll: true });
    };

    const bulk = (ids: number[], status: Status | 'delete') => {
        router.post(`${url}/bulk`, { ids, status }, { preserveScroll: true });
    };

    const columns = React.useMemo<ColumnDef<DataTableFeatures, Comment>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        indeterminate={
                            !table.getIsAllPageRowsSelected() &&
                            table.getIsSomePageRowsSelected()
                        }
                        onCheckedChange={(value) =>
                            table.toggleAllPageRowsSelected(!!value)
                        }
                        aria-label={t('Select all')}
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label={t('Select comment by :author', {
                            author: row.original.author,
                        })}
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'author_name',
                id: 'author_name',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Author')}
                    />
                ),
                cell: ({ row }) => (
                    <div className="flex min-w-0 flex-col">
                        <span className="font-medium">
                            {row.original.author}
                        </span>
                        {row.original.email && (
                            <span className="truncate text-xs text-muted-foreground">
                                {row.original.email}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                id: 'body',
                header: () => t('Comment'),
                cell: ({ row }) => (
                    <p className="line-clamp-3 max-w-md text-sm whitespace-pre-line">
                        {row.original.body}
                    </p>
                ),
                enableSorting: false,
            },
            {
                id: 'type',
                accessorFn: (row) => row.entry?.type ?? '',
                header: () => null,
                cell: () => null,
                enableSorting: false,
            },
            {
                id: 'entry',
                header: () => t('On'),
                cell: ({ row }) =>
                    row.original.entry ? (
                        <span className="text-sm">
                            {row.original.entry.title}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    ),
                enableSorting: false,
            },
            {
                accessorKey: 'created_at',
                id: 'created_at',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t('Date')} />
                ),
                cell: ({ row }) =>
                    formatDateTime(row.original.createdAt, timezone),
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">{t('Actions')}</span>,
                cell: ({ row }) => (
                    <div className="flex justify-end gap-1">
                        {row.original.status !== 'approved' && (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t('Approve comment by :author', {
                                    author: row.original.author,
                                })}
                                onClick={() =>
                                    setStatus(row.original.id, 'approved')
                                }
                            >
                                <Check />
                            </Button>
                        )}
                        {row.original.status !== 'spam' && (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t(
                                    'Mark comment by :author as spam',
                                    { author: row.original.author },
                                )}
                                onClick={() =>
                                    setStatus(row.original.id, 'spam')
                                }
                            >
                                <ShieldAlert />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t('Delete comment by :author', {
                                author: row.original.author,
                            })}
                            onClick={() => {
                                if (
                                    window.confirm(
                                        t(
                                            'Delete this comment? This cannot be undone.',
                                        ),
                                    )
                                ) {
                                    router.delete(`${url}/${row.original.id}`, {
                                        preserveScroll: true,
                                    });
                                }
                            }}
                        >
                            <Trash2 />
                        </Button>
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [t, timezone],
    );

    const bulkActions: DataTableBulkAction<Comment>[] = [
        {
            key: 'approve',
            label: t('Approve'),
            icon: Check,
            onRun: (rows) =>
                bulk(
                    rows.map((row) => row.id),
                    'approved',
                ),
        },
        {
            key: 'spam',
            label: t('Mark as spam'),
            icon: ShieldAlert,
            onRun: (rows) =>
                bulk(
                    rows.map((row) => row.id),
                    'spam',
                ),
        },
        {
            key: 'delete',
            label: t('Delete'),
            icon: Trash2,
            variant: 'destructive',
            confirm: (count) =>
                t('Delete :count comments? This cannot be undone.', { count }),
            onRun: (rows) =>
                bulk(
                    rows.map((row) => row.id),
                    'delete',
                ),
        },
    ];

    return (
        <>
            <Head title={t('Comments')} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Comments')}
                    description={t(
                        'Visitors’ comments wait here until you approve them.',
                    )}
                />

                <div className="flex flex-wrap items-center gap-2">
                    <div
                        role="tablist"
                        aria-label={t('Show comments')}
                        className="flex flex-wrap gap-2"
                    >
                        {tabs.map((tab) => (
                            <Button
                                key={tab.key}
                                type="button"
                                role="tab"
                                size="sm"
                                variant={
                                    query.status === tab.key
                                        ? 'secondary'
                                        : 'ghost'
                                }
                                aria-selected={query.status === tab.key}
                                onClick={() =>
                                    visit({ status: tab.key, page: 1 })
                                }
                            >
                                {tab.label}
                                <Badge variant="outline" className="ms-1">
                                    {counts[tab.key] ?? 0}
                                </Badge>
                            </Button>
                        ))}
                    </div>
                </div>

                <DataTable<Comment>
                    columns={columns}
                    data={comments.data}
                    enableRowSelection
                    bulkActions={bulkActions}
                    pageSizes={pageSizes}
                    initialPageSize={comments.per_page}
                    getRowId={(row) => String(row.id)}
                    emptyMessage={t('No comments in this view.')}
                    hiddenColumns={['type']}
                    toolbar={{
                        search: {
                            column: 'author_name',
                            placeholder: t('Search author or text'),
                        },
                        filters: [
                            {
                                column: 'type',
                                title: t('Content type'),
                                options: types.map((type) => ({
                                    label: type.label,
                                    value: type.key,
                                })),
                            },
                        ],
                        viewOptions: true,
                    }}
                    server={serverState({
                        total: comments.total,
                        pageCount: comments.last_page,
                        perPage: comments.per_page,
                    })}
                />
            </div>
        </>
    );
}
