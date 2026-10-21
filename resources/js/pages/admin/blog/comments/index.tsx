import { Head, Link, router } from '@inertiajs/react';
import { Check, ShieldAlert, Trash2 } from 'lucide-react';
import Pagination from '@/components/cms/pagination';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types/cms';

type Comment = {
    id: number;
    author: string;
    email: string | null;
    body: string;
    status: 'pending' | 'approved' | 'spam';
    createdAt: string | null;
    post: { title: string; slug: string } | null;
};

const STATUSES = ['pending', 'approved', 'spam'] as const;

// Comment moderation. New comments wait as pending until someone approves them.
export default function BlogComments({
    status,
    counts,
    comments,
}: {
    status: 'pending' | 'approved' | 'spam';
    counts: Record<string, number>;
    comments: Paginated<Comment>;
}) {
    const t = useTrans();

    const label = (value: string) => {
        switch (value) {
            case 'pending':
                return t('Waiting');
            case 'approved':
                return t('Approved');
            default:
                return t('Spam');
        }
    };

    const setStatus = (comment: Comment, next: string) => {
        router.patch(
            `/admin/blog/comments/${comment.id}`,
            { status: next },
            { preserveScroll: true },
        );
    };

    const remove = (comment: Comment) => {
        if (window.confirm(t('Delete this comment? This cannot be undone.'))) {
            router.delete(`/admin/blog/comments/${comment.id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title={t('Comments')} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Comments')}
                    description={t(
                        'Approve or remove comments from visitors before they appear on the blog.',
                    )}
                />

                <nav
                    className="flex flex-wrap gap-2"
                    aria-label={t('Filter by status')}
                >
                    {STATUSES.map((item) => (
                        <Link
                            key={item}
                            href={`/admin/blog/comments?status=${item}`}
                            preserveState
                            className={cn(
                                buttonVariants({
                                    variant:
                                        status === item ? 'default' : 'outline',
                                    size: 'sm',
                                }),
                            )}
                        >
                            {label(item)}{' '}
                            <Badge variant="secondary" className="ms-1">
                                {counts[item] ?? 0}
                            </Badge>
                        </Link>
                    ))}
                </nav>

                <div className="overflow-hidden rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Comment')}</TableHead>
                                <TableHead>{t('Post')}</TableHead>
                                <TableHead>{t('Date')}</TableHead>
                                <TableHead className="text-end">
                                    {t('Actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {comments.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center text-muted-foreground"
                                    >
                                        {t('No comments here.')}
                                    </TableCell>
                                </TableRow>
                            )}
                            {comments.data.map((comment) => (
                                <TableRow key={comment.id}>
                                    <TableCell className="max-w-md">
                                        <div className="font-medium">
                                            {comment.author}
                                            {comment.email && (
                                                <span className="ms-2 text-xs font-normal text-muted-foreground">
                                                    {comment.email}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 line-clamp-3 text-sm whitespace-pre-line">
                                            {comment.body}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        {comment.post?.title ?? '–'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {comment.createdAt
                                            ? new Date(
                                                  comment.createdAt,
                                              ).toLocaleString('de-DE')
                                            : '–'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            {comment.status !== 'approved' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setStatus(
                                                            comment,
                                                            'approved',
                                                        )
                                                    }
                                                >
                                                    <Check /> {t('Approve')}
                                                </Button>
                                            )}
                                            {comment.status !== 'spam' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setStatus(
                                                            comment,
                                                            'spam',
                                                        )
                                                    }
                                                >
                                                    <ShieldAlert /> {t('Spam')}
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label={t('Delete')}
                                                onClick={() => remove(comment)}
                                            >
                                                <Trash2 />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <Pagination links={comments.links} />
            </div>
        </>
    );
}
