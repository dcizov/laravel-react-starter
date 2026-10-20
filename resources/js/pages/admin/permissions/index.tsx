import { Head } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import PageHeader from '@/components/page-header';
import { useTrans } from '@/hooks/use-trans';
import { index as indexPermissions } from '@/routes/admin/permissions';

type PermissionRow = {
    id: number;
    name: string;
    roles_count: number;
};

// Read-only. Permissions are defined in the app's code, and roles are built from them.
export default function Permissions({
    permissions,
}: {
    permissions: PermissionRow[];
}) {
    const t = useTrans();

    const columns: ColumnDef<DataTableFeatures, PermissionRow>[] = [
        {
            accessorKey: 'name',
            filterFn: 'includesString',
            meta: { label: 'Name' },
            header: () => t('Name'),
            cell: ({ row }) => (
                <span className="font-mono text-sm">{row.original.name}</span>
            ),
            enableSorting: false,
        },
        {
            id: 'roles',
            meta: { label: 'Roles' },
            header: () => t('Roles'),
            cell: ({ row }) => row.original.roles_count,
            enableSorting: false,
        },
    ];

    const pageSizes = useMemo(() => [10, 20, 30, 40, 50], []);

    return (
        <>
            <Head title={t('Permissions')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Permissions')}
                    description={t(
                        'The app defines these permissions in its code. Give them to roles on the Roles page.',
                    )}
                />

                <DataTable
                    columns={columns}
                    data={permissions}
                    getRowId={(row) => String(row.id)}
                    pageSizes={pageSizes}
                    emptyMessage={t('No permissions yet.')}
                    toolbar={{
                        search: {
                            column: 'name',
                            placeholder: t('Filter permissions...'),
                        },
                    }}
                />
            </div>
        </>
    );
}

Permissions.layout = {
    breadcrumbs: [
        {
            title: 'Permissions',
            href: indexPermissions(),
        },
    ],
};
