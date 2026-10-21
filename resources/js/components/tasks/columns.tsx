import type { ColumnDef } from '@tanstack/react-table';
import { Ellipsis } from 'lucide-react';
import * as React from 'react';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import { labels, priorities, statuses } from '@/components/tasks/data';
import type { Task } from '@/components/tasks/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTrans } from '@/hooks/use-trans';

type TaskActions = {
    onEdit: (task: Task) => void;
    onLabelChange: (id: number, label: string) => void;
    onDelete: (id: number) => void;
    // Admins see everyone's tasks, so the owner column is only added for them.
    showOwner: boolean;
};

// The table columns for tasks. Titles and option labels are translated here.
export function useTaskColumns({
    onEdit,
    onLabelChange,
    onDelete,
    showOwner,
}: TaskActions): ColumnDef<DataTableFeatures, Task>[] {
    const t = useTrans();

    return React.useMemo<ColumnDef<DataTableFeatures, Task>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        indeterminate={
                            !table.getIsAllPageRowsSelected() &&
                            table.getIsSomePageRowsSelected()
                        }
                        onCheckedChange={(value) =>
                            table.toggleAllPageRowsSelected(!!value)
                        }
                        aria-label={t('Select all')}
                        className="translate-y-[2px]"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label={t('Select row')}
                        className="translate-y-[2px]"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'code',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t('Task')} />
                ),
                cell: ({ row }) => (
                    <span className="font-medium">{row.getValue('code')}</span>
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'title',
                filterFn: 'includesString',
                meta: { label: 'Title', detail: true },
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t('Title')} />
                ),
                cell: ({ row }) => {
                    const label = labels.find(
                        (item) => item.value === row.original.label,
                    );

                    return (
                        <div className="flex gap-2">
                            {label && (
                                <Badge variant="outline">
                                    {t(label.label)}
                                </Badge>
                            )}
                            <span className="max-w-[500px] truncate font-medium">
                                {row.getValue('title')}
                            </span>
                        </div>
                    );
                },
            },
            ...(showOwner
                ? ([
                      {
                          accessorKey: 'owner',
                          meta: { label: 'Owner' },
                          header: ({ column }) => (
                              <DataTableColumnHeader
                                  column={column}
                                  title={t('Owner')}
                              />
                          ),
                          cell: ({ row }) => (
                              <span>{row.original.owner ?? '—'}</span>
                          ),
                          enableSorting: false,
                      },
                  ] satisfies ColumnDef<DataTableFeatures, Task>[])
                : []),
            {
                accessorKey: 'status',
                meta: { label: 'Status' },
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Status')}
                    />
                ),
                cell: ({ row }) => {
                    const status = statuses.find(
                        (item) => item.value === row.getValue('status'),
                    );

                    if (!status) {
                        return null;
                    }

                    return (
                        <div className="w-[120px]">
                            <Badge
                                variant="outline"
                                className="px-1.5 text-muted-foreground"
                            >
                                {status.icon && <status.icon />}
                                {t(status.label)}
                            </Badge>
                        </div>
                    );
                },
                filterFn: (row, id, value: string[]) =>
                    value.includes(row.getValue(id)),
            },
            {
                accessorKey: 'priority',
                meta: { label: 'Priority' },
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Priority')}
                    />
                ),
                cell: ({ row }) => {
                    const priority = priorities.find(
                        (item) => item.value === row.getValue('priority'),
                    );

                    if (!priority) {
                        return null;
                    }

                    return (
                        <Badge
                            variant="outline"
                            className="px-1.5 text-muted-foreground"
                        >
                            {priority.icon && <priority.icon />}
                            {t(priority.label)}
                        </Badge>
                    );
                },
                filterFn: (row, id, value: string[]) =>
                    value.includes(row.getValue(id)),
            },
            {
                id: 'actions',
                cell: ({ row }) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="data-[popup-open]:bg-muted"
                                />
                            }
                        >
                            <Ellipsis />
                            <span className="sr-only">{t('Open menu')}</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem
                                onClick={() => onEdit(row.original)}
                            >
                                {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    {t('Labels')}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup
                                        value={row.original.label}
                                        onValueChange={(value) =>
                                            onLabelChange(
                                                row.original.id,
                                                value,
                                            )
                                        }
                                    >
                                        {labels.map((label) => (
                                            <DropdownMenuRadioItem
                                                key={label.value}
                                                value={label.value}
                                            >
                                                {t(label.label)}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => onDelete(row.original.id)}
                            >
                                {t('Delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        [t, onEdit, onLabelChange, onDelete, showOwner],
    );
}
