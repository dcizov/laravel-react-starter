import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import { index as indexRoles, store, update } from '@/routes/admin/roles';

type RoleData = {
    id: number;
    name: string;
    system: boolean;
};

// Creates a role or edits one. Permissions are grouped by the part before the first dot.
export default function RoleForm({
    role,
    permissions,
    granted,
}: {
    role: RoleData | null;
    permissions: string[];
    granted: string[];
}) {
    const t = useTrans();
    // The admin role always has every permission, so its checkboxes are fixed.
    const isAdmin = role?.name === 'admin';

    const form = useForm({
        name: role?.name ?? '',
        permissions: isAdmin ? permissions : granted,
    });

    const groups = useMemo(() => {
        const map = new Map<string, string[]>();

        for (const permission of permissions) {
            const group = permission.split('.')[0];
            map.set(group, [...(map.get(group) ?? []), permission]);
        }

        return [...map.entries()];
    }, [permissions]);

    const togglePermission = (name: string, checked: boolean) => {
        form.setData(
            'permissions',
            checked
                ? [...form.data.permissions, name]
                : form.data.permissions.filter((item) => item !== name),
        );
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (role) {
            form.patch(update.url(role.id), { preserveScroll: true });
        } else {
            form.post(store.url());
        }
    };

    return (
        <>
            <Head title={role ? t('Edit role') : t('Create role')} />
            <form
                onSubmit={submit}
                className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6"
            >
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {role ? t('Edit role') : t('Create role')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('Choose what people with this role can do.')}
                    </p>
                </div>

                {isAdmin && (
                    <p className="rounded-md border p-3 text-sm text-muted-foreground">
                        {t(
                            'The admin role always has every permission and cannot be changed.',
                        )}
                    </p>
                )}

                <div className="grid max-w-md gap-2">
                    <Label htmlFor="name">{t('Name')}</Label>
                    <Input
                        id="name"
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        disabled={role?.system}
                        placeholder="editor"
                        autoComplete="off"
                    />
                    <InputError message={form.errors.name} />
                </div>

                <div className="grid gap-4">
                    <h2 className="text-lg font-semibold">
                        {t('Permissions')}
                    </h2>
                    {groups.length === 0 && (
                        <p className="text-muted-foreground">
                            {t('No permissions exist yet.')}
                        </p>
                    )}
                    {groups.map(([group, names]) => (
                        <fieldset
                            key={group}
                            className="grid gap-3 rounded-xl border p-4"
                        >
                            <legend className="px-1 text-sm font-medium capitalize">
                                {group}
                            </legend>
                            {names.map((name) => {
                                const id = `permission-${name}`;

                                return (
                                    <div
                                        key={name}
                                        className="flex items-center gap-2"
                                    >
                                        <Checkbox
                                            id={id}
                                            checked={form.data.permissions.includes(
                                                name,
                                            )}
                                            disabled={isAdmin}
                                            onCheckedChange={(checked) =>
                                                togglePermission(name, checked)
                                            }
                                        />
                                        <Label
                                            htmlFor={id}
                                            className="font-mono text-sm"
                                        >
                                            {name}
                                        </Label>
                                    </div>
                                );
                            })}
                        </fieldset>
                    ))}
                    <InputError message={form.errors.permissions} />
                </div>

                <div className="flex gap-2">
                    <Link
                        href={indexRoles.url()}
                        className={cn(buttonVariants({ variant: 'outline' }))}
                    >
                        {isAdmin ? t('Back') : t('Cancel')}
                    </Link>
                    {!isAdmin && (
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            {t('Save')}
                        </Button>
                    )}
                </div>
            </form>
        </>
    );
}

RoleForm.layout = {
    breadcrumbs: [
        {
            title: 'Roles',
            href: indexRoles(),
        },
    ],
};
