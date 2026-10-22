import { useCallback } from 'react';
import type { ReactNode } from 'react';
import type { DataTableDetail } from '@/components/data-table/data-table-row-detail';
import { Button } from '@/components/ui/button';
import { DrawerClose } from '@/components/ui/drawer';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { AdminUser } from '@/components/users/data';
import { formatDateTime, roleLabels } from '@/components/users/data';
import { useTrans } from '@/hooks/use-trans';

// The actions a drawer can start. The page decides whether each one asks first.
export type AdminUserAction =
    | 'verify'
    | 'reset'
    | 'suspend'
    | 'reinstate'
    | 'impersonate'
    | 'delete';

type DetailOptions = {
    roles: string[];
    currentUserId: number;
    timezone: string;
    onRoleChange: (user: AdminUser, role: string) => void;
    onAction: (action: AdminUserAction, user: AdminUser) => void;
    onEdit: (user: AdminUser) => void;
};

// Builds the drawer for one user row: the facts, a role select, and the actions.
// The drawer closes before an action runs, so a confirm dialog never sits on top of it.
export function useAdminUserDetail({
    roles,
    currentUserId,
    timezone,
    onRoleChange,
    onAction,
    onEdit,
}: DetailOptions): (user: AdminUser) => DataTableDetail {
    const t = useTrans();

    return useCallback(
        (user: AdminUser): DataTableDetail => {
            const isSelf = user.id === currentUserId;
            const isAdmin = user.role === 'admin';

            const fact = (name: string, value: ReactNode) => (
                <div className="grid grid-cols-[120px_1fr] items-center gap-3">
                    <dt className="text-muted-foreground">{name}</dt>
                    <dd>{value}</dd>
                </div>
            );

            // Items are passed up front, so the label shows on first render.
            const roleItems = roles.map((role) => ({
                value: role,
                label: t(roleLabels[role] ?? role),
            }));

            return {
                title: user.name,
                description: user.email,
                body: (
                    <dl className="flex flex-col gap-3">
                        {fact(
                            t('Role'),
                            <Select
                                items={roleItems}
                                value={user.role}
                                onValueChange={(value) => {
                                    if (value && value !== user.role) {
                                        onRoleChange(user, value);
                                    }
                                }}
                            >
                                <SelectTrigger
                                    size="sm"
                                    className="w-[140px]"
                                    aria-label={t('Role')}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {t(roleLabels[role] ?? role)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>,
                        )}
                        {fact(
                            t('Status'),
                            user.suspended ? t('Suspended') : t('Active'),
                        )}
                        {fact(
                            t('Email verified'),
                            user.verified
                                ? formatDateTime(user.verifiedAt, timezone)
                                : t('Not verified'),
                        )}
                        {fact(
                            t('Created'),
                            formatDateTime(user.createdAt, timezone),
                        )}
                        {fact(t('Tasks'), user.tasksCount)}
                    </dl>
                ),
                footer: (
                    <div className="flex flex-wrap gap-2">
                        <DrawerClose
                            render={
                                <Button
                                    variant="outline"
                                    onClick={() => onEdit(user)}
                                />
                            }
                        >
                            {t('Edit')}
                        </DrawerClose>
                        {!user.verified && (
                            <DrawerClose
                                render={
                                    <Button
                                        variant="outline"
                                        onClick={() => onAction('verify', user)}
                                    />
                                }
                            >
                                {t('Verify email')}
                            </DrawerClose>
                        )}
                        <DrawerClose
                            render={
                                <Button
                                    variant="outline"
                                    onClick={() => onAction('reset', user)}
                                />
                            }
                        >
                            {t('Send password reset')}
                        </DrawerClose>
                        {user.suspended ? (
                            <DrawerClose
                                render={
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            onAction('reinstate', user)
                                        }
                                    />
                                }
                            >
                                {t('Reinstate')}
                            </DrawerClose>
                        ) : (
                            <DrawerClose
                                render={
                                    <Button
                                        variant="outline"
                                        disabled={isSelf}
                                        onClick={() =>
                                            onAction('suspend', user)
                                        }
                                    />
                                }
                            >
                                {t('Suspend')}
                            </DrawerClose>
                        )}
                        <DrawerClose
                            render={
                                <Button
                                    variant="outline"
                                    disabled={
                                        isSelf || isAdmin || user.suspended
                                    }
                                    onClick={() =>
                                        onAction('impersonate', user)
                                    }
                                />
                            }
                        >
                            {t('Impersonate')}
                        </DrawerClose>
                        <DrawerClose
                            render={
                                <Button
                                    variant="destructive"
                                    disabled={isSelf}
                                    onClick={() => onAction('delete', user)}
                                />
                            }
                        >
                            {t('Delete')}
                        </DrawerClose>
                    </div>
                ),
            };
        },
        [t, roles, currentUserId, timezone, onRoleChange, onAction, onEdit],
    );
}
