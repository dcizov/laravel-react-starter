import { Head, router, useForm } from '@inertiajs/react';
import { MailPlus, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Role = 'Admin' | 'Editor' | 'Author';

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: Role | null;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string | null;
    is_self: boolean;
    urls: { update: string; delete: string };
};

type InvitationRow = {
    id: number;
    email: string;
    role: Role;
    expires_at: string;
    urls: { destroy: string };
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
};

type Props = {
    users: Paginated<UserRow>;
    invitations: InvitationRow[];
    filters: { q: string };
    roles: Role[];
    can: { invite: boolean; manage: boolean };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Team', href: '/admin/users' },
    { title: 'Users', href: '/admin/users' },
];

function formatDate(value: string | null): string {
    if (value === null) {
        return 'Never';
    }

    return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function UsersIndex({
    users,
    invitations,
    filters,
    roles,
    can,
}: Props) {
    const [search, setSearch] = useState(filters.q);
    const [inviteOpen, setInviteOpen] = useState(false);

    const inviteForm = useForm({ email: '', role: 'Editor' as Role });

    const submitInvite = () => {
        inviteForm.post('/admin/users/invitations', {
            preserveScroll: true,
            onSuccess: () => {
                inviteForm.reset();
                setInviteOpen(false);
            },
        });
    };

    const updateUser = (
        user: UserRow,
        payload: { role?: Role; is_active?: boolean },
    ) => {
        router.patch(user.urls.update, payload, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="space-y-8">
                <PageHeader
                    title="Users"
                    description="Invite teammates, set their role and deactivate access. Roles decide what each person can do."
                    actions={
                        can.invite ? (
                            <Dialog
                                open={inviteOpen}
                                onOpenChange={setInviteOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button>
                                        <UserPlus className="size-4" />
                                        Invite teammate
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Invite a teammate
                                        </DialogTitle>
                                        <DialogDescription>
                                            They receive an email with a link to
                                            set their password. The invite
                                            expires after seven days.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="invite-email">
                                                Email address
                                            </Label>
                                            <Input
                                                id="invite-email"
                                                type="email"
                                                value={inviteForm.data.email}
                                                onChange={(event) =>
                                                    inviteForm.setData(
                                                        'email',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="teammate@studio.test"
                                            />
                                            {inviteForm.errors.email ? (
                                                <p className="text-xs text-status-error">
                                                    {inviteForm.errors.email}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="invite-role">
                                                Role
                                            </Label>
                                            <Select
                                                value={inviteForm.data.role}
                                                onValueChange={(value) =>
                                                    inviteForm.setData(
                                                        'role',
                                                        value as Role,
                                                    )
                                                }
                                            >
                                                <SelectTrigger id="invite-role">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem
                                                            key={role}
                                                            value={role}
                                                        >
                                                            {role}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setInviteOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={submitInvite}
                                            disabled={inviteForm.processing}
                                        >
                                            {inviteForm.processing ? (
                                                <Spinner />
                                            ) : (
                                                <MailPlus className="size-4" />
                                            )}
                                            Send invitation
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        ) : null
                    }
                />

                <section aria-label="Team members" className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold">
                            Team members
                            <span className="ml-2 font-normal text-muted-foreground">
                                {users.total}
                            </span>
                        </h2>
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    router.get(
                                        '/admin/users',
                                        search ? { q: search } : {},
                                        {
                                            preserveState: true,
                                            replace: true,
                                        },
                                    );
                                }
                            }}
                            placeholder="Search by name or email"
                            className="h-9 w-full sm:w-64"
                            aria-label="Search users"
                        />
                    </div>

                    {users.data.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title={
                                filters.q
                                    ? 'No users match that search'
                                    : 'No teammates yet'
                            }
                            description={
                                filters.q
                                    ? 'Try a different name or email address.'
                                    : 'Invite your first editor so more than one person can work on the site.'
                            }
                            action={
                                <Button
                                    variant="outline"
                                    onClick={() => router.get('/admin/users')}
                                >
                                    Clear search
                                </Button>
                            }
                        />
                    ) : (
                        <Card className="gap-0 py-0">
                            <CardContent className="p-0">
                                <ul className="divide-y divide-border/60">
                                    {users.data.map((user) => (
                                        <li
                                            key={user.id}
                                            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                    {user.name
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {user.name}
                                                        {user.is_self ? (
                                                            <span className="ml-2 text-xs text-muted-foreground">
                                                                you
                                                            </span>
                                                        ) : null}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                                <span className="hidden text-xs text-muted-foreground sm:inline">
                                                    Last seen{' '}
                                                    {formatDate(
                                                        user.last_login_at,
                                                    )}
                                                </span>

                                                <StatusBadge
                                                    status={
                                                        user.is_active
                                                            ? 'published'
                                                            : 'draft'
                                                    }
                                                />

                                                {can.manage ? (
                                                    <Select
                                                        value={
                                                            user.role ??
                                                            undefined
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            updateUser(user, {
                                                                role: value as Role,
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            className="h-8 w-32"
                                                            aria-label={`Role for ${user.name}`}
                                                        >
                                                            <SelectValue placeholder="No role" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {roles.map(
                                                                (role) => (
                                                                    <SelectItem
                                                                        key={
                                                                            role
                                                                        }
                                                                        value={
                                                                            role
                                                                        }
                                                                    >
                                                                        {role}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        {user.role}
                                                    </span>
                                                )}

                                                {can.manage && !user.is_self ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            updateUser(user, {
                                                                is_active:
                                                                    !user.is_active,
                                                            })
                                                        }
                                                    >
                                                        {user.is_active
                                                            ? 'Deactivate'
                                                            : 'Reactivate'}
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </section>

                <section aria-label="Pending invitations" className="space-y-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                        <ShieldCheck className="size-4" />
                        Pending invitations
                    </h2>

                    {invitations.length === 0 ? (
                        <EmptyState
                            icon={MailPlus}
                            title="No pending invitations"
                            description="Invitations you send appear here until they are accepted or expire."
                        />
                    ) : (
                        <Card className="gap-0 py-0">
                            <CardHeader className="sr-only">
                                <CardTitle>Pending invitations</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ul className="divide-y divide-border/60">
                                    {invitations.map((invitation) => (
                                        <li
                                            key={invitation.id}
                                            className="flex items-center justify-between gap-3 px-4 py-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm">
                                                    {invitation.email}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {invitation.role} · expires{' '}
                                                    {formatDate(
                                                        invitation.expires_at,
                                                    )}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    router.delete(
                                                        invitation.urls.destroy,
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            >
                                                Revoke
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
