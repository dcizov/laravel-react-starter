import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { AccountUser } from '@/components/users/data';
import { roleLabels } from '@/components/users/data';
import { useTrans } from '@/hooks/use-trans';

type UserActions = {
    roles: string[];
    onRoleChange: (user: AccountUser, role: string) => void;
};

// The table columns for the Users page. The role select changes the role straight away.
export function useUserColumns({
    roles,
    onRoleChange,
}: UserActions): ColumnDef<DataTableFeatures, AccountUser>[] {
    const t = useTrans();
    // Labels up front, so the server and client render the same role text.
    const roleItems = roles.map((role) => ({
        value: role,
        label: t(roleLabels[role] ?? role),
    }));

    return React.useMemo<ColumnDef<DataTableFeatures, AccountUser>[]>(
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
                    <Select
                        items={roleItems}
                        value={row.original.role}
                        onValueChange={(value) => {
                            if (value && value !== row.original.role) {
                                onRoleChange(row.original, value);
                            }
                        }}
                    >
                        <SelectTrigger
                            size="sm"
                            className="w-[140px]"
                            aria-label={t('Role')}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((role) => (
                                <SelectItem key={role} value={role}>
                                    {t(roleLabels[role] ?? role)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ),
                enableSorting: false,
            },
        ],
        [t, roles, roleItems, onRoleChange],
    );
}
