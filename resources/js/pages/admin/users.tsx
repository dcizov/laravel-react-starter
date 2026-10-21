import { Head, router, usePage } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
    destroy,
    reinstate,
    sendPasswordReset,
    suspend,
    verifyEmail,
} from '@/actions/App/Http/Controllers/Admin/UserManagementController';
import { start as startImpersonation } from '@/actions/App/Http/Controllers/ImpersonationController';
import { updateRole } from '@/actions/App/Http/Controllers/UserController';
import { DataTable } from '@/components/data-table/data-table';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useAdminUserColumns } from '@/components/users/admin-columns';
import type { AdminUserAction } from '@/components/users/admin-user-detail';
import { useAdminUserDetail } from '@/components/users/admin-user-detail';
import {
    AdminActionDialog,
    EditUserDialog,
} from '@/components/users/admin-user-dialogs';
import { BulkRoleActions } from '@/components/users/bulk-role-actions';
import type { AdminUser } from '@/components/users/data';
import { roleLabels } from '@/components/users/data';
import { useTrans } from '@/hooks/use-trans';
import { index as adminUsersIndex } from '@/routes/admin/users';

// Everything an administrator does to accounts. Destructive and identity-changing actions ask first.
export default function AdminUsers({
    users,
    roles,
}: {
    users: AdminUser[];
    roles: string[];
}) {
    const t = useTrans();
    const { timezone, auth } = usePage().props;
    const currentUserId = auth.user.id;

    const [editing, setEditing] = useState<AdminUser | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [pending, setPending] = useState<{
        action: AdminUserAction;
        user: AdminUser;
    } | null>(null);

    const showError = useCallback(
        (errors: Record<string, string>) => {
            toast.add({
                type: 'error',
                title: Object.values(errors)[0] ?? t('Something went wrong.'),
            });
        },
        [t],
    );

    const changeRole = useCallback(
        (user: AdminUser, role: string) => {
            router.patch(
                updateRole.url(user.id),
                { role },
                { preserveScroll: true, onError: showError },
            );
        },
        [showError],
    );

    // Runs an action. The ones that need confirmation reach here only after the user agrees.
    const runAction = useCallback(
        (action: AdminUserAction, user: AdminUser) => {
            const options = { preserveScroll: true, onError: showError };

            switch (action) {
                case 'verify':
                    router.post(verifyEmail.url(user.id), {}, options);
                    break;
                case 'reset':
                    router.post(sendPasswordReset.url(user.id), {}, options);
                    break;
                case 'reinstate':
                    router.post(reinstate.url(user.id), {}, options);
                    break;
                case 'suspend':
                    router.post(suspend.url(user.id), {}, options);
                    break;
                case 'impersonate':
                    router.post(startImpersonation.url(user.id), {}, options);
                    break;
                case 'delete':
                    router.delete(destroy.url(user.id), options);
                    break;
            }
        },
        [showError],
    );

    const onAction = useCallback(
        (action: AdminUserAction, user: AdminUser) => {
            if (
                action === 'suspend' ||
                action === 'impersonate' ||
                action === 'delete'
            ) {
                setPending({ action, user });

                return;
            }

            runAction(action, user);
        },
        [runAction],
    );

    const onEdit = useCallback((user: AdminUser) => {
        setEditing(user);
        setEditOpen(true);
    }, []);

    const renderDetail = useAdminUserDetail({
        roles,
        currentUserId,
        timezone,
        onRoleChange: changeRole,
        onAction,
        onEdit,
    });

    const columns = useAdminUserColumns(timezone);
    const pageSizes = useMemo(() => [10, 20, 30, 40, 50], []);

    return (
        <>
            <Head title={t('Manage users')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Manage users')}
                    description={t(
                        'Edit, verify, suspend, and remove accounts. Select rows to change roles in bulk.',
                    )}
                />

                <DataTable
                    columns={columns}
                    data={users}
                    getRowId={(row) => String(row.id)}
                    pageSizes={pageSizes}
                    enableRowSelection
                    emptyMessage={t('No users found.')}
                    renderDetail={renderDetail}
                    toolbar={{
                        actions: (table) => (
                            <div className="flex items-center gap-2">
                                <BulkRoleActions table={table} roles={roles} />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        // Served as a file download, so the page stays where it is.
                                        window.location.assign(
                                            '/admin/users/export',
                                        );
                                    }}
                                >
                                    <Download />
                                    {t('Export CSV')}
                                </Button>
                            </div>
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
                            {
                                column: 'status',
                                title: t('Status'),
                                options: [
                                    { value: 'active', label: t('Active') },
                                    {
                                        value: 'suspended',
                                        label: t('Suspended'),
                                    },
                                ],
                            },
                        ],
                    }}
                />
            </div>

            <EditUserDialog
                user={editing}
                open={editOpen}
                onOpenChange={setEditOpen}
            />

            <AdminActionDialog
                pending={pending}
                onCancel={() => setPending(null)}
                onConfirm={() => {
                    if (pending) {
                        runAction(pending.action, pending.user);
                    }

                    setPending(null);
                }}
            />
        </>
    );
}

AdminUsers.layout = {
    breadcrumbs: [
        {
            title: 'Manage users',
            href: adminUsersIndex(),
        },
    ],
};
