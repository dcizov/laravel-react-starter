import { Head, router } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';
import { updateRole } from '@/actions/App/Http/Controllers/UserController';
import { DataTable } from '@/components/data-table/data-table';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { useUserColumns } from '@/components/users/columns';
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

    const changeRole = useCallback((user: AccountUser, role: string) => {
        router.patch(
            updateRole.url(user.id),
            { role },
            {
                preserveScroll: true,
                onError: (errors) => {
                    toast.add({
                        type: 'error',
                        title: errors.role ?? t('Could not change the role.'),
                    });
                },
            },
        );
    }, [t]);

    const columns = useUserColumns({ roles, onRoleChange: changeRole });
    const pageSizes = useMemo(() => [10, 20, 30, 40, 50], []);

    return (
        <>
            <Head title={t('Users')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t('Users')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('Manage the roles of everyone with an account.')}
                    </p>
                </div>

                <DataTable
                    columns={columns}
                    data={users}
                    getRowId={(row) => String(row.id)}
                    pageSizes={pageSizes}
                    emptyMessage={t('No users found.')}
                    toolbar={(table) => (
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder={t('Filter users...')}
                                value={
                                    (table
                                        .getColumn('name')
                                        ?.getFilterValue() as string) ?? ''
                                }
                                onChange={(event) =>
                                    table
                                        .getColumn('name')
                                        ?.setFilterValue(event.target.value)
                                }
                                className="h-8 w-[150px] lg:w-[250px]"
                            />
                        </div>
                    )}
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
