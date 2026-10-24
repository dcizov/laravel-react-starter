import { Head, Link, router } from '@inertiajs/react';
import { FileText, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useBreadcrumbs } from '@/components/breadcrumbs-context';
import {
    DataTable,
    DataTableFilterTabs,
    DataTableSearch,
    DataTableToolbar,
} from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { BreadcrumbItem, PageRow } from '@/types';

import { createPageColumns } from './columns';
import type { PageSortToken } from './columns';

type Paginated<T> = {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
};

type Props = {
    pages: Paginated<PageRow>;
    filters: { q: string; status: string; sort: string; trashed: boolean };
    counts: {
        all: number;
        draft: number;
        scheduled: number;
        published: number;
        trashed: number;
    };
    can: { create: boolean; publish: boolean; delete: boolean };
    errors?: Record<string, string>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Content', href: '/admin/pages' },
    { title: 'Pages', href: '/admin/pages' },
];

export default function PagesIndex({ pages, filters, counts, can }: Props) {
    const [busyId, setBusyId] = useState<number | null>(null);
    const [pending, setPending] = useState<number[]>([]);

    const visit = (
        params: Record<string, string | number | boolean | undefined>,
    ) => {
        router.get(
            '/admin/pages',
            params as Record<string, string | number | boolean>,
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    /**
     * Optimistic publish toggle: the optimistic props flip the row immediately
     * and Inertia rolls them back automatically when the request fails.
     */
    const togglePublish = (page: PageRow) => {
        const publishing = page.status !== 'published';

        router
            .optimistic((props: { pages: Paginated<PageRow> }) => ({
                pages: {
                    ...props.pages,
                    data: props.pages.data.map((row) =>
                        row.id === page.id
                            ? {
                                  ...row,
                                  status: publishing
                                      ? ('published' as const)
                                      : ('draft' as const),
                              }
                            : row,
                    ),
                },
            }))
            .post(
                publishing ? page.urls.publish : page.urls.unpublish,
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    onError: () => {
                        toast.error('Change reverted', {
                            description:
                                'The server rejected the update. Your page is unchanged.',
                        });
                    },
                },
            );
    };

    /**
     * Delete with an undo toast. The row leaves the table optimistically and
     * the toast restores it from the trash if clicked in time.
     */
    const destroy = (page: PageRow) => {
        setPending((current) => [...current, page.id]);

        router
            .optimistic((props: { pages: Paginated<PageRow> }) => ({
                pages: {
                    ...props.pages,
                    data: props.pages.data.filter((row) => row.id !== page.id),
                    total: Math.max(0, props.pages.total - 1),
                },
            }))
            .delete(page.urls.destroy, {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    setPending((current) =>
                        current.filter((id) => id !== page.id),
                    );
                    toast.error('Change reverted', {
                        description: 'The page could not be deleted.',
                    });
                },
                onSuccess: () => {
                    setPending((current) =>
                        current.filter((id) => id !== page.id),
                    );
                    toast.success(`“${page.title}” moved to trash`, {
                        action: {
                            label: 'Undo',
                            onClick: () =>
                                router.post(
                                    page.urls.restore,
                                    {},
                                    { preserveScroll: true },
                                ),
                        },
                        duration: 8000,
                    });
                },
            });
    };

    const duplicate = (page: PageRow) => {
        setBusyId(page.id);

        router.post(
            page.urls.duplicate,
            {},
            {
                preserveScroll: true,
                onFinish: () => setBusyId(null),
            },
        );
    };

    const restore = (page: PageRow) => {
        router.post(
            page.urls.restore,
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const sort = (token: PageSortToken) => {
        visit({ ...filters, sort: token, page: undefined });
    };

    const visiblePages = pages.data.filter(
        (page) => !pending.includes(page.id),
    );
    const isFiltered =
        filters.q !== '' || filters.status !== '' || filters.trashed;

    useBreadcrumbs(breadcrumbs);

    return (
        <>
            <Head title="Pages" />

            <div className="space-y-6">
                <PageHeader
                    title="Pages"
                    description="Draft, schedule and publish the pages that make up the site."
                    actions={
                        can.create ? (
                            <Button asChild>
                                <Link href="/admin/pages/create">
                                    <Plus className="size-4" />
                                    New page
                                </Link>
                            </Button>
                        ) : null
                    }
                />

                <DataTable
                    caption="Pages"
                    columns={createPageColumns({
                        sort: filters.sort,
                        can,
                        busyId,
                        onSort: sort,
                        onTogglePublish: togglePublish,
                        onDuplicate: duplicate,
                        onDestroy: destroy,
                        onRestore: restore,
                    })}
                    data={visiblePages}
                    getRowId={(page) => String(page.id)}
                    rowClassName={(page) =>
                        busyId === page.id ? 'opacity-60' : undefined
                    }
                    serverPagination={{
                        pageIndex: Math.max(0, pages.current_page - 1),
                        pageSize: pages.per_page,
                        pageCount: Math.max(1, pages.last_page),
                        total: pages.total,
                    }}
                    onPageChange={(pageIndex) =>
                        visit({ ...filters, page: pageIndex + 1 })
                    }
                    emptyState={
                        <EmptyState
                            icon={FileText}
                            title={
                                filters.q
                                    ? 'No pages match that search'
                                    : filters.trashed
                                      ? 'The trash is empty'
                                      : filters.status === 'draft'
                                        ? 'No drafts right now'
                                        : 'No pages yet'
                            }
                            description={
                                filters.q
                                    ? 'Try a shorter search term or clear the filters.'
                                    : filters.trashed
                                      ? 'Deleted pages stay here until they are restored.'
                                      : 'Start with a page — a hero section is added for you.'
                            }
                            action={
                                filters.q ? (
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            visit({ sort: filters.sort })
                                        }
                                    >
                                        Clear search
                                    </Button>
                                ) : can.create ? (
                                    <Button asChild>
                                        <Link href="/admin/pages/create">
                                            <Plus className="size-4" />
                                            Create the first page
                                        </Link>
                                    </Button>
                                ) : null
                            }
                        />
                    }
                    toolbar={
                        <DataTableToolbar
                            filters={
                                <>
                                    <DataTableFilterTabs
                                        value={
                                            filters.trashed
                                                ? 'trashed'
                                                : filters.status
                                        }
                                        options={[
                                            {
                                                value: '',
                                                label: 'All',
                                                count: counts.all,
                                            },
                                            {
                                                value: 'published',
                                                label: 'Published',
                                                count: counts.published,
                                            },
                                            {
                                                value: 'scheduled',
                                                label: 'Scheduled',
                                                count: counts.scheduled,
                                            },
                                            {
                                                value: 'draft',
                                                label: 'Drafts',
                                                count: counts.draft,
                                            },
                                            ...(counts.trashed > 0
                                                ? [
                                                      {
                                                          value: 'trashed',
                                                          label: 'Trash',
                                                          count: counts.trashed,
                                                      },
                                                  ]
                                                : []),
                                        ]}
                                        onChange={(value) => {
                                            if (value === 'trashed') {
                                                visit({
                                                    ...filters,
                                                    status: '',
                                                    trashed: true,
                                                    page: undefined,
                                                });

                                                return;
                                            }

                                            visit({
                                                ...filters,
                                                status: value,
                                                trashed: undefined,
                                                page: undefined,
                                            });
                                        }}
                                    />
                                    {isFiltered ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                visit({
                                                    sort: filters.sort,
                                                    page: undefined,
                                                })
                                            }
                                        >
                                            Clear filters
                                        </Button>
                                    ) : null}
                                </>
                            }
                        >
                            <DataTableSearch
                                defaultValue={filters.q}
                                placeholder="Search pages"
                                onSearch={(q) =>
                                    visit({
                                        ...filters,
                                        q,
                                        page: undefined,
                                    })
                                }
                            />

                            <Select
                                value={filters.sort}
                                onValueChange={(value) =>
                                    visit({
                                        ...filters,
                                        sort: value,
                                        page: undefined,
                                    })
                                }
                            >
                                <SelectTrigger
                                    className="h-9 w-36 md:hidden"
                                    aria-label="Sort pages"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="updated">
                                        Last updated
                                    </SelectItem>
                                    <SelectItem value="created">
                                        Newest
                                    </SelectItem>
                                    <SelectItem value="title">Title</SelectItem>
                                </SelectContent>
                            </Select>
                        </DataTableToolbar>
                    }
                />
            </div>
        </>
    );
}

export function PagesSkeleton() {
    return (
        <div className="space-y-2">
            {['a', 'b', 'c', 'd', 'e'].map((key) => (
                <Skeleton key={key} className="h-14 w-full" />
            ))}
        </div>
    );
}
