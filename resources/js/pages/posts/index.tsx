import { Head, router } from '@inertiajs/react';
import { Newspaper, Plus, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useBreadcrumbs } from '@/components/breadcrumbs-context';
import { ConfirmDialog } from '@/components/confirm-dialog';
import {
    DataTable,
    DataTableFilterTabs,
    DataTableSearch,
    DataTableToolbar,
} from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

import { createPostColumns } from './columns';
import type { PostRow } from './columns';

type Paginated<T> = {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
};

type Props = {
    posts: Paginated<PostRow>;
    counts: { all: number; draft: number; published: number };
    filters: { q: string; status: string };
    urls: { index: string; create: string; taxonomy: string };
    can: { create: boolean; publish: boolean; delete: boolean };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Content', href: '/admin/posts' },
    { title: 'Posts', href: '/admin/posts' },
];

export default function PostsIndex({
    posts,
    counts,
    filters,
    urls,
    can,
}: Props) {
    const [pendingDelete, setPendingDelete] = useState<PostRow | null>(null);

    const visit = (params: Record<string, string | number | undefined>) => {
        router.get(urls.index, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const toggle = (post: PostRow) => {
        const publishing = !post.is_live;

        router
            .optimistic((props: Props) => ({
                posts: {
                    ...props.posts,
                    data: props.posts.data.map((row) =>
                        row.id === post.id
                            ? {
                                  ...row,
                                  is_live: publishing,
                                  status: publishing
                                      ? ('published' as const)
                                      : ('draft' as const),
                              }
                            : row,
                    ),
                },
                counts: props.counts,
                filters: props.filters,
                urls: props.urls,
                can: props.can,
            }))
            .post(
                publishing ? post.urls.publish : post.urls.unpublish,
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    onError: () =>
                        toast.error('Change reverted', {
                            description: 'The post was not updated.',
                        }),
                },
            );
    };

    const destroy = (post: PostRow) => {
        router.delete(post.urls.destroy, {
            preserveScroll: true,
            onError: () => toast.error('The post could not be deleted'),
        });
        setPendingDelete(null);
    };

    useBreadcrumbs(breadcrumbs);

    return (
        <>
            <Head title="Posts" />

            <div className="space-y-5">
                <PageHeader
                    title="Posts"
                    description={`${counts.all} posts · ${counts.published} published · ${counts.draft} drafts`}
                    actions={
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(urls.taxonomy)}
                            >
                                <Settings2 className="size-4" />
                                Categories & tags
                            </Button>
                            {can.create ? (
                                <Button
                                    size="sm"
                                    onClick={() => router.get(urls.create)}
                                >
                                    <Plus className="size-4" />
                                    New post
                                </Button>
                            ) : null}
                        </>
                    }
                />

                <DataTable
                    caption="Posts"
                    columns={createPostColumns({
                        can,
                        onToggle: toggle,
                        onDelete: setPendingDelete,
                    })}
                    data={posts.data}
                    getRowId={(post) => String(post.id)}
                    serverPagination={{
                        pageIndex: Math.max(0, posts.current_page - 1),
                        pageSize: posts.per_page,
                        pageCount: Math.max(1, posts.last_page),
                        total: posts.total,
                    }}
                    onPageChange={(pageIndex) =>
                        visit({ ...filters, page: pageIndex + 1 })
                    }
                    emptyState={
                        <EmptyState
                            icon={Newspaper}
                            title={
                                filters.q
                                    ? 'No posts match that search'
                                    : 'No posts yet'
                            }
                            description={
                                filters.q
                                    ? 'Try a shorter search term or a different status.'
                                    : can.create
                                      ? 'Write the first one — it stays a draft until you publish it.'
                                      : 'Nothing has been written yet.'
                            }
                        />
                    }
                    toolbar={
                        <DataTableToolbar
                            filters={
                                <DataTableFilterTabs
                                    value={filters.status}
                                    options={[
                                        {
                                            value: '',
                                            label: 'All',
                                            count: counts.all,
                                        },
                                        {
                                            value: 'draft',
                                            label: 'Drafts',
                                            count: counts.draft,
                                        },
                                        {
                                            value: 'published',
                                            label: 'Published',
                                            count: counts.published,
                                        },
                                    ]}
                                    onChange={(status) =>
                                        visit({
                                            q: filters.q || undefined,
                                            status: status || undefined,
                                        })
                                    }
                                />
                            }
                        >
                            <DataTableSearch
                                defaultValue={filters.q}
                                placeholder="Search posts"
                                onSearch={(q) =>
                                    visit({
                                        q: q || undefined,
                                        status: filters.status || undefined,
                                    })
                                }
                            />
                        </DataTableToolbar>
                    }
                />
            </div>

            <ConfirmDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => (open ? null : setPendingDelete(null))}
                title={`Delete “${pendingDelete?.title ?? ''}”?`}
                description="The post and its revision history are removed for good. Unpublish it instead if you only want to take it offline."
                confirmLabel="Delete post"
                onConfirm={() => pendingDelete && destroy(pendingDelete)}
            />
        </>
    );
}
