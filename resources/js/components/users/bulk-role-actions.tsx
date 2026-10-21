import { router } from '@inertiajs/react';
import type { ReactTable } from '@tanstack/react-table';
import { ChevronDown, X } from 'lucide-react';
import { bulkUpdateRole } from '@/actions/App/Http/Controllers/UserController';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import type { AccountUser } from '@/components/users/data';
import { roleLabels } from '@/components/users/data';
import { useTrans } from '@/hooks/use-trans';

// Shown in the toolbar while rows are selected. Gives every selected user the same role.
export function BulkRoleActions<T extends AccountUser>({
    table,
    roles,
}: {
    table: ReactTable<DataTableFeatures, T>;
    roles: string[];
}) {
    const t = useTrans();
    const selected = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original);

    if (selected.length === 0) {
        return null;
    }

    const changeRoles = (role: string) => {
        router.patch(
            bulkUpdateRole.url(),
            { ids: selected.map((user) => user.id), role },
            {
                preserveScroll: true,
                onSuccess: () => table.resetRowSelection(),
                onError: (errors) => {
                    toast.add({
                        type: 'error',
                        title: errors.role ?? t('Could not change the roles.'),
                    });
                },
            },
        );
    };

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={<Button variant="outline" size="sm" />}
                >
                    {t('Change role')}
                    <ChevronDown />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                    {roles.map((role) => (
                        <DropdownMenuItem
                            key={role}
                            onClick={() => changeRoles(role)}
                        >
                            {t(roleLabels[role] ?? role)}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => table.resetRowSelection()}
            >
                {t('Clear selection')}
                <X />
            </Button>
        </div>
    );
}
