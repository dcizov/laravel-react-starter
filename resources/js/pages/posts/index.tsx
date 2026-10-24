import { Head, router } from '@inertiajs/react';
import { FileText, Newspaper, Plus, Search, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

type PostRow = {
    id: number;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    excerpt: string | null;
    category: string | null;
    tags: string[];
    author: string | null;
    published_at: string | null;
    updated_at: string | null;
    is_live: boolean;
    reading_minutes: number;
    urls: {
        edit: string;
        publish: string;
        unpublish: string;
        destroy: string;
        public: string | null;
    };
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
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
    const [search, setSearch] = useState(filters.q);

    const visit = (params: Record<string, string | undefined>) => {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
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

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-48 flex-1">
                        <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                        <Input
                            value={search}
                            placeholder="Search posts"
                            className="pl-8"
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    visit({
                                        q: search,
                                        status: filters.status || undefined,
                                    });
                                }
                            }}
                        />
                    </div>

                    {['', 'draft', 'published'].map((status) => (
                        <Button
                            key={status || 'all'}
                            size="sm"
                            variant={
                                filters.status === status
                                    ? 'secondary'
                                    : 'ghost'
                            }
                            onClick={() =>
                                visit({
                                    q: search,
                                    status: status || undefined,
                                })
                            }
                        >
                            {status === ''
                                ? 'All'
                                : status === 'draft'
                                  ? 'Drafts'
                                  : 'Published'}
                        </Button>
                    ))}
                </div>

                {posts.data.length === 0 ? (
                    <EmptyState
                        icon={Newspaper}
                        title="No posts yet"
                        description={
                            can.create
                                ? 'Write the first one — it stays a draft until you publish it.'
                                : 'Nothing has been written yet.'
                        }
                    />
                ) : (
                    <Card className="overflow-hidden py-0">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-xs text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium">
                                        Title
                                    </th>
                                    <th className="hidden px-3 py-2 text-left font-medium md:table-cell">
                                        Category
                                    </th>
                                    <th className="hidden px-3 py-2 text-left font-medium lg:table-cell">
                                        Author
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium">
                                        Status
                                    </th>
                                    <th className="px-3 py-2 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.data.map((post) => (
                                    <tr
                                        key={post.id}
                                        className="border-t border-border/60"
                                    >
                                        <td className="px-3 py-2">
                                            <button
                                                type="button"
                                                className="flex items-start gap-2 text-left"
                                                onClick={() =>
                                                    router.get(post.urls.edit)
                                                }
                                            >
                                                <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                                                <span className="min-w-0">
                                                    <span className="block max-w-72 truncate font-medium">
                                                        {post.title}
                                                    </span>
                                                    <span className="block truncate text-[11px] text-muted-foreground">
                                                        /blog/{post.slug} ·{' '}
                                                        {post.reading_minutes}{' '}
                                                        min
                                                    </span>
                                                </span>
                                            </button>
                                        </td>
                                        <td className="hidden px-3 py-2 text-xs md:table-cell">
                                            {post.category ?? '—'}
                                        </td>
                                        <td className="hidden px-3 py-2 text-xs lg:table-cell">
                                            {post.author ?? '—'}
                                        </td>
                                        <td className="px-3 py-2">
                                            <StatusBadge
                                                status={
                                                    post.is_live
                                                        ? 'published'
                                                        : 'draft'
                                                }
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {post.urls.public ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7"
                                                        asChild
                                                    >
                                                        <a
                                                            href={
                                                                post.urls.public
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            View
                                                        </a>
                                                    </Button>
                                                ) : null}
                                                {can.publish ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={cn(
                                                            'h-7',
                                                            post.is_live &&
                                                                'text-muted-foreground',
                                                        )}
                                                        onClick={() =>
                                                            toggle(post)
                                                        }
                                                    >
                                                        {post.is_live
                                                            ? 'Unpublish'
                                                            : 'Publish'}
                                                    </Button>
                                                ) : null}
                                                {can.delete ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-status-error"
                                                        onClick={() =>
                                                            setPendingDelete(
                                                                post,
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                )}
            </div>

            <ConfirmDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => (open ? null : setPendingDelete(null))}
                title={`Delete “${pendingDelete?.title ?? ''}”?`}
                description="The post and its revision history are removed for good. Unpublish it instead if you only want to take it offline."
                confirmLabel="Delete post"
                onConfirm={() => pendingDelete && destroy(pendingDelete)}
            />
        </AppLayout>
    );
}
