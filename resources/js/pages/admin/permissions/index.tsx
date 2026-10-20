import { Head, router, useForm } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import InputError from '@/components/input-error';
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
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { useTrans } from '@/hooks/use-trans';
import {
    destroy,
    index as indexPermissions,
    store,
    update,
} from '@/routes/admin/permissions';

type PermissionRow = {
    id: number;
    name: string;
    roles_count: number;
    built_in: boolean;
};

// Built-in permissions are the ones the app checks, so they cannot be renamed or deleted.
// Custom permissions can be created here, then given to roles on the Roles page.
export default function Permissions({
    permissions,
}: {
    permissions: PermissionRow[];
}) {
    const t = useTrans();
    const [renaming, setRenaming] = useState<PermissionRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<PermissionRow | null>(
        null,
    );
    const [deleting, setDeleting] = useState(false);

    const createForm = useForm({ name: '' });
    const renameForm = useForm({ name: '' });

    const submitCreate = (event: FormEvent) => {
        event.preventDefault();
        createForm.post(store.url(), {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    };

    const openRename = (permission: PermissionRow) => {
        renameForm.setData('name', permission.name);
        renameForm.clearErrors();
        setRenaming(permission);
    };

    const submitRename = (event: FormEvent) => {
        event.preventDefault();

        if (!renaming) {
            return;
        }

        renameForm.patch(update.url(renaming.id), {
            preserveScroll: true,
            onSuccess: () => setRenaming(null),
        });
    };

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
                    title: errors.name ?? t('Could not delete the permission.'),
                });
            },
        });
    };

    // Not memoized: the actions read the rename form, which changes on every render.
    const columns: ColumnDef<DataTableFeatures, PermissionRow>[] = [
        {
            accessorKey: 'name',
            filterFn: 'includesString',
            meta: { label: 'Name' },
            header: () => t('Name'),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                        {row.original.name}
                    </span>
                    {row.original.built_in && (
                        <Badge variant="secondary">{t('Built in')}</Badge>
                    )}
                </div>
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
        {
            id: 'actions',
            enableHiding: false,
            enableSorting: false,
            meta: { label: 'Actions' },
            header: () => null,
            cell: ({ row }) =>
                row.original.built_in ? null : (
                    <div className="flex justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('Edit')}
                            onClick={() => openRename(row.original)}
                        >
                            <Pencil />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('Delete')}
                            onClick={() => setPendingDelete(row.original)}
                        >
                            <Trash2 />
                        </Button>
                    </div>
                ),
        },
    ];

    const pageSizes = useMemo(() => [10, 20, 30, 40, 50], []);

    return (
        <>
            <Head title={t('Permissions')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t('Permissions')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t(
                            'Permissions are what the app checks. Create a custom one, then give it to roles.',
                        )}
                    </p>
                </div>

                <form
                    onSubmit={submitCreate}
                    className="flex max-w-xl flex-col gap-2"
                >
                    <Label htmlFor="permission-name">
                        {t('New permission')}
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id="permission-name"
                            value={createForm.data.name}
                            onChange={(event) =>
                                createForm.setData('name', event.target.value)
                            }
                            placeholder="reports.export"
                            className="font-mono"
                            autoComplete="off"
                        />
                        <Button type="submit" disabled={createForm.processing}>
                            {createForm.processing ? <Spinner /> : <Plus />}
                            {t('Create permission')}
                        </Button>
                    </div>
                    <InputError message={createForm.errors.name} />
                </form>

                <DataTable
                    columns={columns}
                    data={permissions}
                    getRowId={(row) => String(row.id)}
                    pageSizes={pageSizes}
                    emptyMessage={t('No permissions yet.')}
                />
            </div>

            <Dialog
                open={renaming !== null}
                onOpenChange={(open) => !open && setRenaming(null)}
            >
                <DialogContent>
                    <form onSubmit={submitRename} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>{t('Rename permission')}</DialogTitle>
                            <DialogDescription>
                                {t(
                                    'Renaming a custom permission keeps it on every role that has it.',
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-2">
                            <Label htmlFor="rename-permission">
                                {t('Name')}
                            </Label>
                            <Input
                                id="rename-permission"
                                value={renameForm.data.name}
                                onChange={(event) =>
                                    renameForm.setData(
                                        'name',
                                        event.target.value,
                                    )
                                }
                                className="font-mono"
                                autoComplete="off"
                            />
                            <InputError message={renameForm.errors.name} />
                        </div>
                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={renameForm.processing}
                            >
                                {renameForm.processing && <Spinner />}
                                {t('Save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
                        <AlertDialogTitle>
                            {t('Delete permission?')}
                        </AlertDialogTitle>
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

Permissions.layout = {
    breadcrumbs: [
        {
            title: 'Permissions',
            href: indexPermissions(),
        },
    ],
};
