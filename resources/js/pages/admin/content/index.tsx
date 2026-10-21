import { Head, Link, router } from '@inertiajs/react';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import Pagination from '@/components/cms/pagination';
import { publicPath } from '@/components/cms/public-path';
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
import type { ContentTypeInfo, PaginatorLink } from '@/types/cms';

type Row = {
    id: number;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    live: boolean;
    publishedAt: string | null;
    updatedAt: string | null;
    author: string | null;
};

// The entries of one content type, with links to edit, view, and delete each one.
export default function AdminContentIndex({
    type,
    entries,
}: {
    type: ContentTypeInfo;
    entries: { data: Row[]; links: PaginatorLink[] };
}) {
    const t = useTrans();
    const base = `/admin/content/${type.key}`;

    const remove = (row: Row) => {
        if (
            window.confirm(
                t('Delete “:title”? This cannot be undone.', {
                    title: row.title,
                }),
            )
        ) {
            router.delete(`${base}/${row.id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title={type.label} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={type.label}
                    description={t('Write and publish :type entries.', {
                        type: type.singular.toLowerCase(),
                    })}
                    actions={
                        <Link
                            href={`${base}/create`}
                            className={buttonVariants({ size: 'sm' })}
                        >
                            <Plus /> {t('New :type', { type: type.singular })}
                        </Link>
                    }
                />

                <div className="overflow-hidden rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Title')}</TableHead>
                                <TableHead>{t('Status')}</TableHead>
                                <TableHead>{t('Published')}</TableHead>
                                <TableHead>{t('Last changed')}</TableHead>
                                <TableHead className="text-end">
                                    {t('Actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center text-muted-foreground"
                                    >
                                        {t('No entries yet.')}
                                    </TableCell>
                                </TableRow>
                            )}
                            {entries.data.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">
                                        {row.title}
                                        <div className="text-xs text-muted-foreground">
                                            /{row.slug}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {row.status === 'published' ? (
                                            <Badge
                                                variant={
                                                    row.live
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {row.live
                                                    ? t('Live')
                                                    : t('Scheduled')}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">
                                                {t('Draft')}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {row.publishedAt
                                            ? new Date(
                                                  row.publishedAt,
                                              ).toLocaleString('de-DE')
                                            : '–'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {row.updatedAt
                                            ? new Date(
                                                  row.updatedAt,
                                              ).toLocaleString('de-DE')
                                            : '–'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            {row.live && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label={t('View')}
                                                    render={
                                                        <a
                                                            href={publicPath(
                                                                type.key,
                                                                row.slug,
                                                            )}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        />
                                                    }
                                                    nativeButton={false}
                                                >
                                                    <ExternalLink />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label={t('Edit')}
                                                render={
                                                    <Link
                                                        href={`${base}/${row.id}/edit`}
                                                    />
                                                }
                                                nativeButton={false}
                                            >
                                                <Pencil />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label={t('Delete')}
                                                onClick={() => remove(row)}
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
                <Pagination links={entries.links} />
            </div>
        </>
    );
}
