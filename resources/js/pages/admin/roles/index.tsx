import { Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import {
    create,
    destroy,
    edit,
    index as indexRoles,
} from '@/routes/admin/roles';

type RoleRow = {
    id: number;
    name: string;
    permissions_count: number;
    users_count: number;
    system: boolean;
};

// Roles and how many permissions and users each has. The admin role and the default role cannot be deleted.
export default function Roles({ roles }: { roles: RoleRow[] }) {
    const t = useTrans();
    const [pendingDelete, setPendingDelete] = useState<RoleRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const confirmDelete = () => {
        if (!pendingDelete) {
            return;
        }

        router.delete(destroy.url(pendingDelete.id), {
            preserveScroll: true,
            onStart: () => setDeleting(true),
            onFinish: () => setDeleting(false),
            onSuccess: () => setPendingDelete(null),
            onError: (errors) => {
                setPendingDelete(null);
                toast.add({
                    type: 'error',
                    title: errors.role ?? t('Could not delete the role.'),
                });
            },
        });
    };

    const columns = useMemo<ColumnDef<DataTableFeatures, RoleRow>[]>(
        () => [
            {
                accessorKey: 'name',
                filterFn: 'includesString',
                meta: { label: 'Name' },
                header: () => t('Name'),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{row.original.name}</span>
                        {row.original.system && (
                            <Badge variant="secondary">{t('System')}</Badge>
                        )}
                    </div>
                ),
                enableSorting: false,
            },
            {
                id: 'permissions',
                meta: { label: 'Permissions' },
                header: () => t('Permissions'),
                cell: ({ row }) => row.original.permissions_count,
                enableSorting: false,
            },
            {
                id: 'users',
                meta: { label: 'Users' },
                header: () => t('Users'),
                cell: ({ row }) => row.original.users_count,
                enableSorting: false,
            },
            {
                id: 'actions',
                enableHiding: false,
                enableSorting: false,
                meta: { label: 'Actions' },
                header: () => null,
                cell: ({ row }) => (
                    <div className="flex justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('Edit')}
                            onClick={() =>
                                router.visit(edit.url(row.original.id))
                            }
                        >
                            <Pencil />
                        </Button>
                        {!row.original.system && (
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t('Delete')}
                                onClick={() => setPendingDelete(row.original)}
                            >
                                <Trash2 />
                            </Button>
                        )}
                    </div>
                ),
            },
        ],
        [t],
    );

    const pageSizes = useMemo(() => [10, 20, 30, 40, 50], []);

    return (
        <>
            <Head title={t('Roles')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            {t('Roles')}
                        </h1>
                        <p className="text-muted-foreground">
                            {t(
                                'Group permissions into roles and give roles to users.',
                            )}
                        </p>
                    </div>
                    <Link
                        href={create.url()}
                        className={cn(buttonVariants({ size: 'default' }))}
                    >
                        <Plus />
                        {t('Create role')}
                    </Link>
                </div>

                <DataTable
                    columns={columns}
                    data={roles}
                    getRowId={(row) => String(row.id)}
                    pageSizes={pageSizes}
                    emptyMessage={t('No roles yet.')}
                    toolbar={{
                        search: {
                            column: 'name',
                            placeholder: t('Filter roles...'),
                        },
                    }}
                />
            </div>

            <AlertDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !deleting) {
                        setPendingDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('Delete role?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                ':name will be permanently deleted. This cannot be undone.',
                                { name: pendingDelete?.name ?? '' },
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>
                            {t('Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={deleting}
                            onClick={(event) => {
                                event.preventDefault();
                                confirmDelete();
                            }}
                        >
                            {deleting && <Spinner />}
                            {t('Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

Roles.layout = {
    breadcrumbs: [
        {
            title: 'Roles',
            href: indexRoles(),
        },
    ],
};
