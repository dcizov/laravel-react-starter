import { Head, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import type { AuditEntry } from '@/components/users/data';
import { formatDateTime } from '@/components/users/data';
import { useTrans } from '@/hooks/use-trans';
import { index as auditLogIndex } from '@/routes/admin/audit-log';

// A read-only record of account changes, role changes, exports, and impersonation.
export default function AuditLog({ entries }: { entries: AuditEntry[] }) {
    const t = useTrans();
    const { timezone } = usePage().props;
    const pageSizes = useMemo(() => [10, 20, 30, 40, 50], []);

    const columns = useMemo<ColumnDef<DataTableFeatures, AuditEntry>[]>(
        () => [
            {
                accessorKey: 'createdAt',
                meta: { label: 'When' },
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t('When')} />
                ),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(row.original.createdAt, timezone)}
                    </span>
                ),
                enableSorting: false,
            },
            {
                accessorKey: 'actor',
                meta: { label: 'Actor' },
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t('Actor')} />
                ),
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span>{row.original.actor}</span>
                        {row.original.impersonator && (
                            <span className="text-xs text-muted-foreground">
                                {t('Impersonated by :name', {
                                    name: row.original.impersonator,
                                })}
                            </span>
                        )}
                    </div>
                ),
                enableSorting: false,
            },
            {
                accessorKey: 'action',
                filterFn: 'includesString',
                meta: { label: 'Action' },
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Action')}
                    />
                ),
                cell: ({ row }) => (
                    <Badge variant="outline" className="font-mono">
                        {row.original.action}
                    </Badge>
                ),
                enableSorting: false,
            },
            {
                accessorKey: 'subject',
                meta: { label: 'Subject' },
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Subject')}
                    />
                ),
                cell: ({ row }) => row.original.subject,
                enableSorting: false,
            },
            {
                accessorKey: 'ipAddress',
                meta: { label: 'IP address' },
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('IP address')}
                    />
                ),
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-muted-foreground">
                        {row.original.ipAddress}
                    </span>
                ),
                enableSorting: false,
            },
            {
                accessorKey: 'details',
                meta: { label: 'Details' },
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Details')}
                    />
                ),
                cell: ({ row }) => (
                    <span className="max-w-[260px] truncate font-mono text-xs text-muted-foreground">
                        {row.original.details}
                    </span>
                ),
                enableSorting: false,
            },
        ],
        [t, timezone],
    );

    return (
        <>
            <Head title={t('Audit log')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Audit log')}
                    description={t(
                        'The 500 most recent changes to accounts, roles, exports, and impersonation.',
                    )}
                />

                <DataTable
                    columns={columns}
                    data={entries}
                    getRowId={(row) => String(row.id)}
                    pageSizes={pageSizes}
                    emptyMessage={t('No entries yet.')}
                    enableRowSelection={false}
                    toolbar={{
                        search: {
                            column: 'action',
                            placeholder: t('Filter by action...'),
                        },
                    }}
                />
            </div>
        </>
    );
}

AuditLog.layout = {
    breadcrumbs: [
        {
            title: 'Audit log',
            href: auditLogIndex(),
        },
    ],
};
