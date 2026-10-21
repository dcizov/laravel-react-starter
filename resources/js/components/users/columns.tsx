import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import { Badge } from '@/components/ui/badge';
import type { AccountUser } from '@/components/users/data';
import { roleLabels } from '@/components/users/data';
import { useTrans } from '@/hooks/use-trans';

// The columns of the read-only Users directory. Nothing here changes data.
export function useUserColumns(): ColumnDef<DataTableFeatures, AccountUser>[] {
    const t = useTrans();

    return React.useMemo<ColumnDef<DataTableFeatures, AccountUser>[]>(
        () => [
            {
                accessorKey: 'name',
                filterFn: 'includesString',
                meta: { label: 'Name' },
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
        ],
        [t],
    );
}
