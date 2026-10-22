import { Head, Link, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    ExternalLink,
    ArchiveRestore,
    Eye,
    FileText,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import * as React from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import type { DataTableBulkAction } from '@/components/data-table/data-table-bulk-actions';
import { useServerTable } from '@/components/data-table/use-server-table';
import type { ServerTableQuery } from '@/components/data-table/use-server-table';
import PageHeader from '@/components/page-header';
import { formatDateTime } from '@/components/users/data';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTrans } from '@/hooks/use-trans';
import type { ContentTypeInfo } from '@/types/cms';

type Row = {
    id: number;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    scheduled: boolean;
    live: boolean;
    trashed: boolean;
    publishedAt: string | null;
    updatedAt: string | null;
    author: string | null;
    editUrl: string;
    viewUrl: string | null;
    canEdit: boolean;
    canDelete: boolean;
};

type Filter = 'all' | 'published' | 'draft' | 'scheduled' | 'trashed';

type Paginated<T> = {
    data: T[];
    total: number;
    last_page: number;
    per_page: number;
    current_page: number;
};

// The entries of one content type. Search, status, sorting and paging are server-side and kept in the URL.
export default function AdminContentIndex({
    type,
    entries,
    query,
    counts,
    can,
    pageSizes,
}: {
    type: ContentTypeInfo;
    entries: Paginated<Row>;
    query: ServerTableQuery & { status: Filter };
    counts: Record<Filter, number>;
    can: { create: boolean; publish: boolean; delete: boolean };
    pageSizes: number[];
}) {
    const t = useTrans();
    const { timezone } = usePage().props;
    const base = `/admin/content/${type.key}`;
    const statusFilter = query.status;

    const { serverState, visit } = useServerTable({
        url: base,
        query,
        only: ['entries', 'counts', 'query'],
        filterKeys: [],
    });

    const statusTabs: { key: Filter; label: string }[] = [
        { key: 'all', label: t('All') },
        { key: 'published', label: t('Published') },
        { key: 'draft', label: t('Drafts') },
        { key: 'scheduled', label: t('Scheduled') },
        { key: 'trashed', label: t('Trash') },
    ];

    const columns = React.useMemo<ColumnDef<DataTableFeatures, Row>[]>(
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
                        aria-label={t('Select :title', {
                            title: row.original.title,
                        })}
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'title',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t('Title')} />
                ),
                cell: ({ row }) => (
                    <div className="flex min-w-0 flex-col">
                        <a
                            href={row.original.editUrl}
                            className="truncate font-medium hover:underline"
                        >
                            {row.original.title}
                        </a>
                        <span className="truncate text-xs text-muted-foreground">
                            /{row.original.slug}
                        </span>
                    </div>
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
                cell: ({ row }) => <StatusBadge row={row.original} />,
            },
            {
                accessorKey: 'published_at',
                id: 'published_at',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Published')}
                    />
                ),
                cell: ({ row }) =>
                    formatDateTime(row.original.publishedAt, timezone),
            },
            {
                accessorKey: 'updated_at',
                id: 'updated_at',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Last changed')}
                    />
                ),
                cell: ({ row }) =>
                    formatDateTime(row.original.updatedAt, timezone),
            },
            {
                id: 'author',
                header: () => t('Author'),
                cell: ({ row }) => row.original.author ?? '—',
                enableSorting: false,
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">{t('Actions')}</span>,
                cell: ({ row }) => (
                    <RowActions
                        row={row.original}
                        onTrash={trash}
                        onRestore={restore}
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
        ],
        // The handlers only use stable values from this page, so the columns are built once per type.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [type.key, t, timezone],
    );

    const run = (action: string, ids: number[]) => {
        router.post(
            `${base}/bulk`,
            { action, ids },
            { preserveScroll: true, preserveState: false },
        );
    };

    function trash(row: Row) {
        router.delete(`${base}/${row.id}`, { preserveScroll: true });
    }

    function restore(row: Row) {
        router.post(`${base}/${row.id}/restore`, {}, { preserveScroll: true });
    }

    const bulkActions: DataTableBulkAction<Row>[] = [
        {
            key: 'trash',
            label: t('Move to trash'),
            icon: Trash2,
            variant: 'outline',
            disabled: !can.delete || statusFilter === 'trashed',
            onRun: (rows) =>
                run(
                    'trash',
                    rows.map((row) => row.id),
                ),
        },
        {
            key: 'restore',
            label: t('Restore'),
            icon: ArchiveRestore,
            variant: 'outline',
            disabled: !can.delete || statusFilter !== 'trashed',
            onRun: (rows) =>
                run(
                    'restore',
                    rows.map((row) => row.id),
                ),
        },
        {
            key: 'publish',
            label: t('Publish'),
            icon: Eye,
            variant: 'outline',
            disabled: !can.publish || statusFilter === 'trashed',
            onRun: (rows) =>
                run(
                    'publish',
                    rows.map((row) => row.id),
                ),
        },
        {
            key: 'draft',
            label: t('Move to drafts'),
            icon: FileText,
            variant: 'outline',
            disabled: !can.publish || statusFilter === 'trashed',
            onRun: (rows) =>
                run(
                    'draft',
                    rows.map((row) => row.id),
                ),
        },
        {
            key: 'forceDelete',
            label: t('Delete permanently'),
            icon: Trash2,
            variant: 'destructive',
            disabled: !can.delete || statusFilter !== 'trashed',
            confirm: (count) =>
                t(
                    'Permanently delete :count entries? Their comments and earlier versions are deleted too. This cannot be undone.',
                    { count },
                ),
            onRun: (rows) =>
                run(
                    'forceDelete',
                    rows.map((row) => row.id),
                ),
        },
    ];

    return (
        <>
            <Head title={type.label} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={type.label}
                    description={t('Write and publish :type entries.', {
                        type: type.singular.toLowerCase(),
                    })}
                    actions={
                        can.create ? (
                            <Link
                                href={`${base}/create`}
                                className={buttonVariants({ size: 'sm' })}
                            >
                                <Plus />{' '}
                                {t('New :type', { type: type.singular })}
                            </Link>
                        ) : null
                    }
                />

                <div
                    role="tablist"
                    aria-label={t('Show entries')}
                    className="flex flex-wrap gap-2"
                >
                    {statusTabs.map((tab) => (
                        <Button
                            key={tab.key}
                            type="button"
                            role="tab"
                            size="sm"
                            variant={
                                statusFilter === tab.key ? 'secondary' : 'ghost'
                            }
                            aria-selected={statusFilter === tab.key}
                            onClick={() => visit({ status: tab.key, page: 1 })}
                        >
                            {tab.label}
                            <span className="ms-1 text-muted-foreground">
                                {counts[tab.key] ?? 0}
                            </span>
                        </Button>
                    ))}
                </div>

                <DataTable<Row>
                    columns={columns}
                    data={entries.data}
                    enableRowSelection
                    bulkActions={bulkActions}
                    pageSizes={pageSizes}
                    initialPageSize={entries.per_page}
                    getRowId={(row) => String(row.id)}
                    emptyMessage={
                        statusFilter === 'trashed'
                            ? t('The trash is empty.')
                            : t('No entries yet.')
                    }
                    toolbar={{
                        search: {
                            column: 'title',
                            placeholder: t('Search title or excerpt'),
                        },
                        viewOptions: true,
                    }}
                    server={serverState({
                        total: entries.total,
                        pageCount: entries.last_page,
                        perPage: entries.per_page,
                    })}
                />
            </div>
        </>
    );
}

function StatusBadge({ row }: { row: Row }) {
    const t = useTrans();

    if (row.trashed) {
        return <Badge variant="destructive">{t('In trash')}</Badge>;
    }

    if (row.scheduled) {
        return <Badge variant="outline">{t('Scheduled')}</Badge>;
    }

    return row.status === 'published' ? (
        <Badge>{t('Published')}</Badge>
    ) : (
        <Badge variant="secondary">{t('Draft')}</Badge>
    );
}

function RowActions({
    row,
    onTrash,
    onRestore,
}: {
    row: Row;
    onTrash: (row: Row) => void;
    onRestore: (row: Row) => void;
}) {
    const t = useTrans();

    return (
        <div className="flex justify-end gap-1">
            {row.viewUrl && (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('View :title', { title: row.title })}
                    render={
                        <a
                            href={row.viewUrl}
                            target="_blank"
                            rel="noreferrer"
                        />
                    }
                >
                    <ExternalLink />
                </Button>
            )}
            {row.canEdit && !row.trashed && (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('Edit :title', { title: row.title })}
                    render={<a href={row.editUrl} />}
                >
                    <Pencil />
                </Button>
            )}
            {row.canDelete && !row.trashed && (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('Move :title to trash', { title: row.title })}
                    onClick={() => onTrash(row)}
                >
                    <Trash2 />
                </Button>
            )}
            {row.canDelete && row.trashed && (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('Restore :title', { title: row.title })}
                    onClick={() => onRestore(row)}
                >
                    <ArchiveRestore />
                </Button>
            )}
        </div>
    );
}
