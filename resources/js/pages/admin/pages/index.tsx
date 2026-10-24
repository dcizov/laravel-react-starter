import { Head, Link, router } from '@inertiajs/react';
import {
    Copy,
    Eye,
    FileText,
    MoreHorizontal,
    Plus,
    RotateCcw,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem, PageRow } from '@/types';

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
};

type Props = {
    pages: Paginated<PageRow>;
    filters: { q: string; status: string; sort: string; trashed: boolean };
    counts: { all: number; draft: number; scheduled: number; published: number; trashed: number };
    can: { create: boolean; publish: boolean; delete: boolean };
    errors?: Record<string, string>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Content', href: '/admin/pages' },
    { title: 'Pages', href: '/admin/pages' },
];

/** Laravel paginator labels arrive HTML-escaped (`&laquo; Previous`). */
function plainLabel(label: string): string {
    return label
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .replace(/&amp;/g, '&');
}

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

export default function PagesIndex({ pages, filters, counts, can }: Props) {
    const [search, setSearch] = useState(filters.q);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [pending, setPending] = useState<number[]>([]);

    const visit = (params: Record<string, string | number | boolean | undefined>) => {
        router.get('/admin/pages', params as Record<string, string | number | boolean>, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
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
                            ? { ...row, status: publishing ? ('published' as const) : ('draft' as const) }
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
                            description: 'The server rejected the update. Your page is unchanged.',
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
                    setPending((current) => current.filter((id) => id !== page.id));
                    toast.error('Change reverted', {
                        description: 'The page could not be deleted.',
                    });
                },
                onSuccess: () => {
                    setPending((current) => current.filter((id) => id !== page.id));
                    toast.success(`“${page.title}” moved to trash`, {
                        action: {
                            label: 'Undo',
                            onClick: () => router.post(page.urls.restore, {}, { preserveScroll: true }),
                        },
                        duration: 8000,
                    });
                },
            });
    };

    const duplicate = (page: PageRow) => {
        setBusyId(page.id);

        router.post(page.urls.duplicate, {}, {
            preserveScroll: true,
            onFinish: () => setBusyId(null),
        });
    };

    const visiblePages = pages.data.filter((page) => !pending.includes(page.id));
    const isEmpty = visiblePages.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
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

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {(
                            [
                                ['', 'All', counts.all],
                                ['published', 'Published', counts.published],
                                ['scheduled', 'Scheduled', counts.scheduled],
                                ['draft', 'Drafts', counts.draft],
                            ] as const
                        ).map(([value, label, count]) => (
                            <Button
                                key={label}
                                size="sm"
                                variant={!filters.trashed && filters.status === value ? 'secondary' : 'ghost'}
                                onClick={() => visit({ ...filters, status: value, trashed: undefined })}
                            >
                                {label}
                                <span className="text-muted-foreground ml-1 text-xs">{count}</span>
                            </Button>
                        ))}

                        {counts.trashed > 0 || filters.trashed ? (
                            <Button
                                size="sm"
                                variant={filters.trashed ? 'secondary' : 'ghost'}
                                onClick={() => visit({ ...filters, trashed: filters.trashed ? undefined : 1 })}
                            >
                                Trash
                                <span className="text-muted-foreground ml-1 text-xs">{counts.trashed}</span>
                            </Button>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        visit({ ...filters, q: search });
                                    }
                                }}
                                placeholder="Search pages"
                                aria-label="Search pages"
                                className="h-9 w-full pl-8 sm:w-56"
                            />
                        </div>

                        <Select value={filters.sort} onValueChange={(value) => visit({ ...filters, sort: value })}>
                            <SelectTrigger className="h-9 w-36" aria-label="Sort pages">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="updated">Last updated</SelectItem>
                                <SelectItem value="created">Newest</SelectItem>
                                <SelectItem value="title">Title</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {isEmpty ? (
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
                                <Button variant="outline" onClick={() => { setSearch(''); visit({ sort: filters.sort }); }}>
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
                ) : (
                    <Card className="gap-0 overflow-hidden py-0">
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <caption className="sr-only">Pages</caption>
                                <thead className="bg-muted/40">
                                    <tr className="border-b border-border">
                                        <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Page
                                        </th>
                                        <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Status
                                        </th>
                                        <th scope="col" className="hidden px-4 py-2.5 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase sm:table-cell">
                                            Author
                                        </th>
                                        <th scope="col" className="hidden px-4 py-2.5 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase md:table-cell">
                                            Updated
                                        </th>
                                        <th scope="col" className="px-4 py-2.5 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visiblePages.map((page) => (
                                        <tr
                                            key={page.id}
                                            className={cn(
                                                'border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40',
                                                busyId === page.id && 'opacity-60',
                                            )}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <Link
                                                        href={page.urls.edit}
                                                        className="font-medium hover:text-primary transition-colors"
                                                    >
                                                        {page.title}
                                                    </Link>
                                                    <span className="text-muted-foreground text-xs">
                                                        /{page.slug}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {page.is_trashed ? (
                                                    <StatusBadge status="error" />
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="-ml-2 h-7"
                                                        onClick={() => togglePublish(page)}
                                                        disabled={!can.publish || page.status === 'scheduled'}
                                                        title={
                                                            can.publish
                                                                ? 'Toggle publish state'
                                                                : 'You are not allowed to publish'
                                                        }
                                                    >
                                                        <StatusBadge status={page.status} />
                                                    </Button>
                                                )}
                                            </td>
                                            <td className="text-muted-foreground hidden px-4 py-3 text-xs sm:table-cell">
                                                {page.author ?? '—'}
                                            </td>
                                            <td className="text-muted-foreground hidden px-4 py-3 text-xs md:table-cell">
                                                {formatDate(page.updated_at)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${page.title}`}>
                                                            <MoreHorizontal className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={page.urls.edit}>Edit</Link>
                                                        </DropdownMenuItem>
                                                        {page.urls.preview ? (
                                                            <DropdownMenuItem asChild>
                                                                <a href={page.urls.preview} target="_blank" rel="noreferrer">
                                                                    <Eye className="size-3.5" />
                                                                    Preview
                                                                </a>
                                                            </DropdownMenuItem>
                                                        ) : null}
                                                        {page.urls.public ? (
                                                            <DropdownMenuItem asChild>
                                                                <a href={page.urls.public} target="_blank" rel="noreferrer">
                                                                    View live
                                                                </a>
                                                            </DropdownMenuItem>
                                                        ) : null}
                                                        {can.create && !page.is_trashed ? (
                                                            <DropdownMenuItem onClick={() => duplicate(page)}>
                                                                <Copy className="size-3.5" />
                                                                Duplicate
                                                            </DropdownMenuItem>
                                                        ) : null}
                                                        <DropdownMenuSeparator />
                                                        {page.is_trashed ? (
                                                            <DropdownMenuItem onClick={() => router.post(page.urls.restore, {}, { preserveScroll: true })}>
                                                                <RotateCcw className="size-3.5" />
                                                                Restore
                                                            </DropdownMenuItem>
                                                        ) : can.delete ? (
                                                            <DropdownMenuItem variant="destructive" onClick={() => destroy(page)}>
                                                                <Trash2 className="size-3.5" />
                                                                Move to trash
                                                            </DropdownMenuItem>
                                                        ) : null}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {pages.links.length > 3 ? (
                    <nav className="flex flex-wrap items-center justify-center gap-1" aria-label="Pagination">
                        {pages.links.map((link, slot) =>
                            link.url ? (
                                <Button
                                    key={link.url}
                                    size="sm"
                                    variant={link.active ? 'secondary' : 'ghost'}
                                    onClick={() => router.get(link.url as string, {}, { preserveState: true, preserveScroll: true })}
                                >
                                    {plainLabel(link.label)}
                                </Button>
                            ) : (
                                // Disabled gap ("...") links share a label, so position is the key.
                                // eslint-disable-next-line @eslint-react/no-array-index-key
                                <Button key={`gap-${slot}`} size="sm" variant="ghost" disabled>
                                    {plainLabel(link.label)}
                                </Button>
                            ),
                        )}
                    </nav>
                ) : null}
            </div>
        </AppLayout>
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
