import { Link } from '@inertiajs/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FileText } from 'lucide-react';

import type { DataTableFeatures } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PostRow = {
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
    featured_image: {
        id: number;
        url: string;
        thumbnail_url: string | null;
        alt: string | null;
    } | null;
    urls: {
        edit: string;
        publish: string;
        unpublish: string;
        destroy: string;
        public: string | null;
    };
};

export type PostColumnOptions = {
    can: { create: boolean; publish: boolean; delete: boolean };
    onToggle: (post: PostRow) => void;
    onDelete: (post: PostRow) => void;
};

const columnHelper = createColumnHelper<DataTableFeatures, PostRow>();

export function createPostColumns({
    can,
    onToggle,
    onDelete,
}: PostColumnOptions) {
    return columnHelper.columns([
        columnHelper.accessor('title', {
            id: 'title',
            meta: { label: 'Title' },
            // The primary column is the row's identity; hiding it helps nobody.
            enableHiding: false,
            header: () => (
                <span className="text-xs font-medium tracking-wide uppercase">
                    Title
                </span>
            ),
            enableSorting: false,
            cell: ({ row }) => {
                const post = row.original;

                return (
                    <Link
                        href={post.urls.edit}
                        className="group flex items-start gap-2 text-left"
                    >
                        {post.featured_image ? (
                            <img
                                src={
                                    post.featured_image.thumbnail_url ??
                                    post.featured_image.url
                                }
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="size-9 shrink-0 rounded object-cover"
                            />
                        ) : (
                            <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="min-w-0">
                            <span className="block max-w-72 truncate font-medium transition-colors group-hover:text-primary">
                                {post.title}
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                                /blog/{post.slug} · {post.reading_minutes} min
                            </span>
                        </span>
                    </Link>
                );
            },
        }),
        columnHelper.accessor('category', {
            id: 'category',
            meta: { label: 'Category', className: 'hidden md:table-cell' },
            header: () => (
                <span className="text-xs font-medium tracking-wide uppercase">
                    Category
                </span>
            ),
            enableSorting: false,
            cell: ({ row }) => (
                <span className="text-xs">{row.original.category ?? '—'}</span>
            ),
        }),
        columnHelper.accessor('author', {
            id: 'author',
            meta: { label: 'Author', className: 'hidden lg:table-cell' },
            header: () => (
                <span className="text-xs font-medium tracking-wide uppercase">
                    Author
                </span>
            ),
            enableSorting: false,
            cell: ({ row }) => (
                <span className="text-xs">{row.original.author ?? '—'}</span>
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
            cell: ({ row }) => (
                <StatusBadge
                    status={row.original.is_live ? 'published' : 'draft'}
                />
            ),
        }),
        columnHelper.display({
            id: 'actions',
            enableHiding: false,
            meta: { className: 'text-right' },
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => {
                const post = row.original;

                return (
                    <div className="flex items-center justify-end gap-1">
                        {post.urls.public ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7"
                                asChild
                            >
                                <a
                                    href={post.urls.public}
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
                                    post.is_live && 'text-muted-foreground',
                                )}
                                onClick={() => onToggle(post)}
                            >
                                {post.is_live ? 'Unpublish' : 'Publish'}
                            </Button>
                        ) : null}
                        {can.delete ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-status-error"
                                onClick={() => onDelete(post)}
                            >
                                Delete
                            </Button>
                        ) : null}
                    </div>
                );
            },
        }),
    ]);
}
