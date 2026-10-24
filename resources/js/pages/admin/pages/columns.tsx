import { Link } from '@inertiajs/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Copy, Eye, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';

import { DataTableSortButton } from '@/components/data-table';
import type { DataTableFeatures } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { PageRow } from '@/types';

export type PageSortToken = 'updated' | 'created' | 'title';

export type PageColumnOptions = {
    sort: string;
    can: { create: boolean; publish: boolean; delete: boolean };
    busyId: number | null;
    onSort: (token: PageSortToken) => void;
    onTogglePublish: (page: PageRow) => void;
    onDuplicate: (page: PageRow) => void;
    onDestroy: (page: PageRow) => void;
    onRestore: (page: PageRow) => void;
};

const columnHelper = createColumnHelper<DataTableFeatures, PageRow>();

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Columns for the pages list.
 *
 * Sorting is a server concern here: the controller accepts a single direction
 * per token (`?sort=title` ascends, `?sort=updated` descends), so the header
 * advertises that direction instead of offering a client-side illusion.
 */
export function createPageColumns({
    sort,
    can,
    busyId,
    onSort,
    onTogglePublish,
    onDuplicate,
    onDestroy,
    onRestore,
}: PageColumnOptions) {
    return columnHelper.columns([
        columnHelper.accessor('title', {
            id: 'title',
            meta: { label: 'Page' },
            header: () => (
                <DataTableSortButton
                    label="Page"
                    active={sort === 'title'}
                    direction="asc"
                    onSort={() => onSort('title')}
                />
            ),
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <Link
                        href={row.original.urls.edit}
                        className="font-medium transition-colors hover:text-primary"
                    >
                        {row.original.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                        /{row.original.slug}
                    </span>
                </div>
            ),
        }),
        columnHelper.accessor('status', {
            id: 'status',
            meta: { label: 'Status' },
            header: () => (
                <span className="text-xs font-medium tracking-wide uppercase">
                    Status
                </span>
            ),
            enableSorting: false,
            cell: ({ row }) => {
                const page = row.original;

                if (page.is_trashed) {
                    return <StatusBadge status="error" />;
                }

                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 h-7"
                        onClick={() => onTogglePublish(page)}
                        disabled={
                            !can.publish ||
                            page.status === 'scheduled' ||
                            busyId === page.id
                        }
                        title={
                            can.publish
                                ? 'Toggle publish state'
                                : 'You are not allowed to publish'
                        }
                    >
                        <StatusBadge status={page.status} />
                    </Button>
                );
            },
        }),
        columnHelper.accessor('author', {
            id: 'author',
            meta: { label: 'Author', className: 'hidden sm:table-cell' },
            header: () => (
                <span className="text-xs font-medium tracking-wide uppercase">
                    Author
                </span>
            ),
            enableSorting: false,
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.author ?? '—'}
                </span>
            ),
        }),
        columnHelper.accessor('updated_at', {
            id: 'updated_at',
            meta: { label: 'Updated', className: 'hidden md:table-cell' },
            header: () => (
                <DataTableSortButton
                    label="Updated"
                    active={sort === 'updated'}
                    direction="desc"
                    onSort={() => onSort('updated')}
                />
            ),
            enableSorting: false,
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {formatDate(row.original.updated_at)}
                </span>
            ),
        }),
        columnHelper.display({
            id: 'actions',
            enableHiding: false,
            meta: { className: 'text-right' },
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => {
                const page = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    'size-8',
                                    busyId === page.id && 'opacity-60',
                                )}
                                aria-label={`Actions for ${page.title}`}
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                                <Link href={page.urls.edit}>Edit</Link>
                            </DropdownMenuItem>
                            {page.urls.preview ? (
                                <DropdownMenuItem asChild>
                                    <a
                                        href={page.urls.preview}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <Eye className="size-3.5" />
                                        Preview
                                    </a>
                                </DropdownMenuItem>
                            ) : null}
                            {page.urls.public ? (
                                <DropdownMenuItem asChild>
                                    <a
                                        href={page.urls.public}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        View live
                                    </a>
                                </DropdownMenuItem>
                            ) : null}
                            {can.create && !page.is_trashed ? (
                                <DropdownMenuItem
                                    onClick={() => onDuplicate(page)}
                                >
                                    <Copy className="size-3.5" />
                                    Duplicate
                                </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator />
                            {page.is_trashed ? (
                                <DropdownMenuItem
                                    onClick={() => onRestore(page)}
                                >
                                    <RotateCcw className="size-3.5" />
                                    Restore
                                </DropdownMenuItem>
                            ) : can.delete ? (
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => onDestroy(page)}
                                >
                                    <Trash2 className="size-3.5" />
                                    Move to trash
                                </DropdownMenuItem>
                            ) : null}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        }),
    ]);
}
