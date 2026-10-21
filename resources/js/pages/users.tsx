import { Head, router } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';
import { updateRole } from '@/actions/App/Http/Controllers/UserController';
import { DataTable } from '@/components/data-table/data-table';
import PageHeader from '@/components/page-header';
import { toast } from '@/components/ui/toast';
import { BulkRoleActions } from '@/components/users/bulk-role-actions';
import { useUserColumns } from '@/components/users/columns';
import { roleLabels } from '@/components/users/data';
import type { AccountUser } from '@/components/users/data';
import { useTrans } from '@/hooks/use-trans';
import { index as usersIndex } from '@/routes/users';

// Everyone with an account and their role. Changing a role saves at once.
export default function Users({
    users,
    roles,
}: {
    users: AccountUser[];
    roles: string[];
}) {
    const t = useTrans();

    const changeRole = useCallback(
        (user: AccountUser, role: string) => {
            router.patch(
                updateRole.url(user.id),
                { role },
                {
                    preserveScroll: true,
                    onError: (errors) => {
                        toast.add({
                            type: 'error',
                            title:
                                errors.role ?? t('Could not change the role.'),
                        });
                    },
                },
            );
        },
        [t],
    );

    const columns = useUserColumns({ roles, onRoleChange: changeRole });
    const pageSizes = useMemo(() => [10, 20, 30, 40, 50], []);

    return (
        <>
            <Head title={t('Users')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Users')}
                    description={t(
                        'Manage the roles of everyone with an account.',
                    )}
                />

                <DataTable
                    columns={columns}
                    data={users}
                    getRowId={(row) => String(row.id)}
                    pageSizes={pageSizes}
                    emptyMessage={t('No users found.')}
                    toolbar={{
                        // Bulk actions appear while rows are selected.
                        actions: (table) => (
                            <BulkRoleActions table={table} roles={roles} />
                        ),
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
