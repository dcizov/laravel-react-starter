import { Head, router } from '@inertiajs/react';
import { Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    NativeSelect,
    NativeSelectOption,
} from '@/components/ui/native-select';
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
import { destroy, exportCsv, index } from '@/routes/admin/newsletter';

type Subscriber = {
    id: number;
    email: string;
    status: 'subscribed' | 'unsubscribed';
    subscribedAt: string | null;
    unsubscribedAt: string | null;
};

type Page = {
    data: Subscriber[];
    prev_page_url: string | null;
    next_page_url: string | null;
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    subscribers: Page;
    filters: { search: string; status: string | null };
    counts: { subscribed: number; unsubscribed: number };
};

// The newsletter sign-ups. Admins can search, remove a subscriber, or export the list as CSV.
export default function AdminNewsletter({
    subscribers,
    filters,
    counts,
}: Props) {
    const t = useTrans();
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status ?? '');
    const [pendingDelete, setPendingDelete] = useState<Subscriber | null>(null);

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            index.url(),
            { search, status: status || undefined },
            { preserveState: true, replace: true },
        );
    };

    const confirmDelete = () => {
        if (!pendingDelete) {
            return;
        }

        router.delete(destroy.url(pendingDelete.id), {
            preserveScroll: true,
            onFinish: () => setPendingDelete(null),
        });
    };

    const formatDate = (value: string | null) =>
        value ? new Date(value).toLocaleDateString() : '-';

    return (
        <>
            <Head title={t('Newsletter')} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Newsletter')}
                    description={t(
                        'People who signed up to receive the newsletter.',
                    )}
                    actions={
                        <a
                            href={exportCsv.url()}
                            className={cn(
                                buttonVariants({ variant: 'outline' }),
                            )}
                        >
                            <Download />
                            {t('Export CSV')}
                        </a>
                    }
                />

                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span>
                        {t('Subscribed')}: {counts.subscribed}
                    </span>
                    <span>·</span>
                    <span>
                        {t('Unsubscribed')}: {counts.unsubscribed}
                    </span>
                </div>

                <form
                    onSubmit={applyFilters}
                    className="flex flex-wrap items-center gap-2"
                >
                    <Input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={t('Search by email')}
                        aria-label={t('Search by email')}
                        className="max-w-xs"
                    />
                    <NativeSelect
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        aria-label={t('Status')}
                    >
                        <NativeSelectOption value="">
                            {t('All statuses')}
                        </NativeSelectOption>
                        <NativeSelectOption value="subscribed">
                            {t('Subscribed')}
                        </NativeSelectOption>
                        <NativeSelectOption value="unsubscribed">
                            {t('Unsubscribed')}
                        </NativeSelectOption>
                    </NativeSelect>
                    <Button type="submit" variant="outline">
                        {t('Search')}
                    </Button>
                </form>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Email')}</TableHead>
                                <TableHead>{t('Status')}</TableHead>
                                <TableHead>{t('Subscribed')}</TableHead>
                                <TableHead className="w-12">
                                    <span className="sr-only">
                                        {t('Actions')}
                                    </span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subscribers.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center text-muted-foreground"
                                    >
                                        {t('No subscribers found.')}
                                    </TableCell>
                                </TableRow>
                            )}
                            {subscribers.data.map((subscriber) => (
                                <TableRow key={subscriber.id}>
                                    <TableCell className="font-medium">
                                        {subscriber.email}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                subscriber.status ===
                                                'subscribed'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                        >
                                            {subscriber.status === 'subscribed'
                                                ? t('Subscribed')
                                                : t('Unsubscribed')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(subscriber.subscribedAt)}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={t('Remove subscriber')}
                                            onClick={() =>
                                                setPendingDelete(subscriber)
                                            }
                                        >
                                            <Trash2 />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        {t('Page :current of :last', {
                            current: subscribers.current_page,
                            last: subscribers.last_page,
                        })}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!subscribers.prev_page_url}
                            onClick={() =>
                                subscribers.prev_page_url &&
                                router.visit(subscribers.prev_page_url, {
                                    preserveState: true,
                                })
                            }
                        >
                            {t('Previous')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!subscribers.next_page_url}
                            onClick={() =>
                                subscribers.next_page_url &&
                                router.visit(subscribers.next_page_url, {
                                    preserveState: true,
                                })
                            }
                        >
                            {t('Next')}
                        </Button>
                    </div>
                </div>
            </div>

            <AlertDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => !open && setPendingDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('Remove this subscriber?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                ':email will be removed from the list. They can sign up again later.',
                                { email: pendingDelete?.email ?? '' },
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>
                            {t('Remove')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
