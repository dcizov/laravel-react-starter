import { Head, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, Trash2 } from 'lucide-react';
import * as React from 'react';
import { DataTable } from '@/components/data-table/data-table';
import type { DataTableBulkAction } from '@/components/data-table/data-table-bulk-actions';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import { useServerTable } from '@/components/data-table/use-server-table';
import type { ServerTableQuery } from '@/components/data-table/use-server-table';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDateTime } from '@/components/users/data';
import { useTrans } from '@/hooks/use-trans';
import { csv, destroy, index } from '@/routes/admin/newsletter';

type Subscriber = {
    id: number;
    email: string;
    status: 'subscribed' | 'unsubscribed';
    subscribedAt: string | null;
    unsubscribedAt: string | null;
};

type Paginated<T> = {
    data: T[];
    total: number;
    last_page: number;
    per_page: number;
    current_page: number;
};

type Filter = 'all' | 'subscribed' | 'unsubscribed';

// The newsletter sign-ups. Search, status, sorting and paging are server-side and kept in the URL. Admins can remove
// one or several subscribers, or export the whole list as CSV.
export default function AdminNewsletter({
    subscribers,
    query,
    counts,
    pageSizes,
}: {
    subscribers: Paginated<Subscriber>;
    query: ServerTableQuery & { status: Filter };
    counts: Record<Filter, number>;
    pageSizes: number[];
}) {
    const t = useTrans();
    const { timezone } = usePage().props;

    const { serverState, visit } = useServerTable({
        url: index.url(),
        query,
        only: ['subscribers', 'counts', 'query'],
        filterKeys: [],
    });

    const tabs: { key: Filter; label: string }[] = [
        { key: 'all', label: t('All') },
        { key: 'subscribed', label: t('Subscribed') },
        { key: 'unsubscribed', label: t('Unsubscribed') },
    ];

    const remove = (ids: number[]) => {
        router.post(
            '/admin/newsletter/bulk-delete',
            { ids },
            { preserveScroll: true },
        );
    };

    const columns = React.useMemo<ColumnDef<DataTableFeatures, Subscriber>[]>(
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
                        aria-label={t('Select :email', {
                            email: row.original.email,
                        })}
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'email',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t('Email')} />
                ),
                cell: ({ row }) => (
                    <span className="font-medium break-all">
                        {row.original.email}
                    </span>
                ),
            },
            {
                accessorKey: 'status',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Status')}
                    />
                ),
                cell: ({ row }) =>
                    row.original.status === 'subscribed' ? (
                        <Badge>{t('Subscribed')}</Badge>
                    ) : (
                        <Badge variant="secondary">{t('Unsubscribed')}</Badge>
                    ),
            },
            {
                accessorKey: 'subscribed_at',
                id: 'subscribed_at',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Subscribed')}
                    />
                ),
                cell: ({ row }) =>
                    formatDateTime(row.original.subscribedAt, timezone),
            },
            {
                accessorKey: 'unsubscribed_at',
                id: 'unsubscribed_at',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Unsubscribed')}
                    />
                ),
                cell: ({ row }) =>
                    formatDateTime(row.original.unsubscribedAt, timezone),
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">{t('Actions')}</span>,
                cell: ({ row }) => (
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t('Remove :email', {
                                email: row.original.email,
                            })}
                            onClick={() => {
                                if (
                                    window.confirm(
                                        t('Remove :email from the list?', {
                                            email: row.original.email,
                                        }),
                                    )
                                ) {
                                    router.delete(
                                        destroy.url(row.original.id),
                                        {
                                            preserveScroll: true,
                                        },
                                    );
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
        [t, timezone],
    );

    const bulkActions: DataTableBulkAction<Subscriber>[] = [
        {
            key: 'remove',
            label: t('Remove'),
            icon: Trash2,
            variant: 'destructive',
            confirm: (count) =>
                t(
                    'Remove :count subscribers from the list? They will not receive the newsletter any more.',
                    { count },
                ),
            onRun: (rows) => remove(rows.map((row) => row.id)),
        },
    ];

    return (
        <>
            <Head title={t('Newsletter')} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Newsletter')}
                    description={t('People who signed up for the newsletter.')}
                    actions={
                        <a
                            href={csv.url()}
                            className={buttonVariants({
                                variant: 'outline',
                                size: 'sm',
                            })}
                        >
                            <Download /> {t('Export CSV')}
                        </a>
                    }
                />

                <div
                    role="tablist"
                    aria-label={t('Show subscribers')}
                    className="flex flex-wrap gap-2"
                >
                    {tabs.map((tab) => (
                        <Button
                            key={tab.key}
                            type="button"
                            role="tab"
                            size="sm"
                            variant={
                                query.status === tab.key ? 'secondary' : 'ghost'
                            }
                            aria-selected={query.status === tab.key}
                            onClick={() => visit({ status: tab.key, page: 1 })}
                        >
                            {tab.label}
                            <span className="ms-1 text-muted-foreground">
                                {counts[tab.key] ?? 0}
                            </span>
                        </Button>
                    ))}
                </div>

                <DataTable<Subscriber>
                    columns={columns}
                    data={subscribers.data}
                    enableRowSelection
                    bulkActions={bulkActions}
                    pageSizes={pageSizes}
                    initialPageSize={subscribers.per_page}
                    getRowId={(row) => String(row.id)}
                    emptyMessage={t('No subscribers match this view.')}
                    toolbar={{
                        search: {
                            column: 'email',
                            placeholder: t('Search by email'),
                        },
                        viewOptions: true,
                    }}
                    server={serverState({
                        total: subscribers.total,
                        pageCount: subscribers.last_page,
                        perPage: subscribers.per_page,
                    })}
                />
            </div>
        </>
    );
}
