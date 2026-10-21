import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { update } from '@/actions/App/Http/Controllers/Admin/UserManagementController';
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
import type { AdminUserAction } from '@/components/users/admin-user-detail';
import type { AdminUser } from '@/components/users/data';
import { useTrans } from '@/hooks/use-trans';

// Edit a user's name and email. Changing the email marks it unverified again.
export function EditUserDialog({
    user,
    open,
    onOpenChange,
}: {
    user: AdminUser | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                {user && (
                    <EditUserForm
                        user={user}
                        onDone={() => onOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

// Mounted only while the dialog is open, so each opening starts from the saved values.
function EditUserForm({
    user,
    onDone,
}: {
    user: AdminUser;
    onDone: () => void;
}) {
    const t = useTrans();
    const form = useForm({ name: user.name, email: user.email });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.patch(update.url(user.id), {
            preserveScroll: true,
            onSuccess: onDone,
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-4">
            <DialogHeader>
                <DialogTitle>{t('Edit user')}</DialogTitle>
                <DialogDescription>
                    {t(
                        'Changing the email address marks it unverified until it is verified again.',
                    )}
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
                <Label htmlFor="edit-user-name">{t('Name')}</Label>
                <Input
                    id="edit-user-name"
                    value={form.data.name}
                    onChange={(event) =>
                        form.setData('name', event.target.value)
                    }
                    aria-invalid={!!form.errors.name}
                />
                {form.errors.name && (
                    <p className="text-sm text-destructive">
                        {form.errors.name}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="edit-user-email">{t('Email')}</Label>
                <Input
                    id="edit-user-email"
                    type="email"
                    value={form.data.email}
                    onChange={(event) =>
                        form.setData('email', event.target.value)
                    }
                    aria-invalid={!!form.errors.email}
                />
                {form.errors.email && (
                    <p className="text-sm text-destructive">
                        {form.errors.email}
                    </p>
                )}
            </div>

            <DialogFooter>
                <Button type="submit" disabled={form.processing}>
                    {t('Save')}
                </Button>
            </DialogFooter>
        </form>
    );
}

// The confirmation for actions that need a second click: suspend, impersonate, and delete.
export function AdminActionDialog({
    pending,
    onCancel,
    onConfirm,
}: {
    pending: { action: AdminUserAction; user: AdminUser } | null;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const t = useTrans();

    const copy = (() => {
        if (!pending) {
            return null;
        }

        const name = pending.user.name;

        switch (pending.action) {
            case 'suspend':
                return {
                    title: t('Suspend :name?', { name }),
                    description: t(
                        'They will be signed out and cannot sign in until the account is reinstated.',
                    ),
                    confirm: t('Suspend'),
                    destructive: false,
                };
            case 'impersonate':
                return {
                    title: t('Sign in as :name?', { name }),
                    description: t(
                        'You will use the app as this user. Everything you do while impersonating is recorded in the audit log.',
                    ),
                    confirm: t('Impersonate'),
                    destructive: false,
                };
            case 'delete':
                return {
                    title: t('Delete :name?', { name }),
                    description: t(
                        'This permanently deletes the account and its tasks. This cannot be undone.',
                    ),
                    confirm: t('Delete'),
                    destructive: true,
                };
            default:
                return null;
        }
    })();

    return (
        <AlertDialog
            open={pending !== null && copy !== null}
            onOpenChange={(open) => {
                if (!open) {
                    onCancel();
                }
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{copy?.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {copy?.description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        variant={copy?.destructive ? 'destructive' : 'default'}
                        onClick={onConfirm}
                    >
                        {copy?.confirm}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
