import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { AdminUser } from '@/components/users/data';
import { formatDateTime, roleLabels } from '@/components/users/data';
import { useTrans } from '@/hooks/use-trans';

// The columns of the admin Users page. Changing a role is done in the detail drawer or the bulk menu.
export function useAdminUserColumns(
    timezone: string,
): ColumnDef<DataTableFeatures, AdminUser>[] {
    const t = useTrans();

    return React.useMemo<ColumnDef<DataTableFeatures, AdminUser>[]>(
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
                        className="translate-y-[2px]"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label={t('Select row')}
                        className="translate-y-[2px]"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'name',
                filterFn: 'includesString',
                // Clicking the name opens the drawer with the details and actions.
                meta: { label: 'Name', detail: true },
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t('Name')} />
                ),
                cell: ({ row }) => (
                    <span className="font-medium">{row.original.name}</span>
                ),
                enableSorting: false,
            },
            {
                accessorKey: 'email',
                meta: { label: 'Email' },
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t('Email')} />
                ),
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.email}
                    </span>
                ),
                enableSorting: false,
            },
            {
                accessorKey: 'role',
                meta: { label: 'Role' },
                filterFn: (row, id, value: string[]) =>
                    value.includes(row.getValue(id)),
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t('Role')} />
                ),
                cell: ({ row }) => (
                    <Badge variant="outline">
                        {t(roleLabels[row.original.role] ?? row.original.role)}
                    </Badge>
                ),
                enableSorting: false,
            },
            {
                id: 'status',
                accessorFn: (row) => (row.suspended ? 'suspended' : 'active'),
                meta: { label: 'Status' },
                filterFn: (row, id, value: string[]) =>
                    value.includes(row.getValue(id)),
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Status')}
                    />
                ),
                cell: ({ row }) =>
                    row.original.suspended ? (
                        <Badge variant="destructive">{t('Suspended')}</Badge>
                    ) : (
                        <Badge variant="secondary">{t('Active')}</Badge>
                    ),
                enableSorting: false,
            },
            {
                id: 'verified',
                accessorFn: (row) => row.verified,
                meta: { label: 'Email verified' },
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Email verified')}
                    />
                ),
                cell: ({ row }) =>
                    row.original.verified ? (
                        <span>{t('Verified')}</span>
                    ) : (
                        <span className="text-muted-foreground">
                            {t('Not verified')}
                        </span>
                    ),
                enableSorting: false,
            },
            {
                id: 'tasks',
                accessorFn: (row) => row.tasksCount,
                meta: { label: 'Tasks' },
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t('Tasks')} />
                ),
                cell: ({ row }) => row.original.tasksCount,
                enableSorting: false,
            },
            {
                id: 'created',
                accessorFn: (row) => row.createdAt,
                meta: { label: 'Created' },
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Created')}
                    />
                ),
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {formatDateTime(row.original.createdAt, timezone)}
                    </span>
                ),
                enableSorting: false,
            },
        ],
        [t, timezone],
    );
}
