import { Head } from '@inertiajs/react';
import { useMemo } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import PageHeader from '@/components/page-header';
import { useUserColumns } from '@/components/users/columns';
import { roleLabels } from '@/components/users/data';
import type { AccountUser } from '@/components/users/data';
import { useTrans } from '@/hooks/use-trans';
import { index as usersIndex } from '@/routes/users';

// A read-only directory of everyone with an account. Administrators manage users at /admin/users.
export default function Users({
    users,
    roles,
}: {
    users: AccountUser[];
    roles: string[];
}) {
    const t = useTrans();
    const columns = useUserColumns();
    const pageSizes = useMemo(() => [10, 20, 30, 40, 50], []);

    return (
        <>
            <Head title={t('Users')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Users')}
                    description={t('Everyone with an account.')}
                />

                <DataTable
                    columns={columns}
                    data={users}
                    getRowId={(row) => String(row.id)}
                    pageSizes={pageSizes}
                    emptyMessage={t('No users found.')}
                    enableRowSelection={false}
                    toolbar={{
                        search: {
                            column: 'name',
                            placeholder: t('Filter users...'),
                        },
                        filters: [
                            {
                                column: 'role',
                                title: t('Role'),
                                options: roles.map((role) => ({
                                    value: role,
                                    label: t(roleLabels[role] ?? role),
                                })),
                            },
                        ],
                    }}
                />
            </div>
        </>
    );
}

Users.layout = {
    breadcrumbs: [
        {
            title: 'Users',
            href: usersIndex(),
        },
    ],
};
