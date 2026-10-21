import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { Taxonomy } from '@/types/cms';

type Term = {
    id: number;
    taxonomy: Taxonomy;
    name: string;
    slug: string;
    entriesCount: number;
};

// Categories and tags. They are shared by every content type that supports them.
export default function CmsTerms({ terms }: { terms: Term[] }) {
    const t = useTrans();
    const [editing, setEditing] = useState<Term | 'new' | null>(null);

    const remove = (term: Term) => {
        if (
            window.confirm(
                t('Delete “:name”? It will be removed from its entries.', {
                    name: term.name,
                }),
            )
        ) {
            router.delete(`/admin/cms/terms/${term.id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title={t('Categories and tags')} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Categories and tags')}
                    description={t(
                        'Group entries by topic. Categories and tags work the same way; use whichever suits you.',
                    )}
                    actions={
                        <Button size="sm" onClick={() => setEditing('new')}>
                            <Plus /> {t('New term')}
                        </Button>
                    }
                />

                <div className="overflow-hidden rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Name')}</TableHead>
                                <TableHead>{t('Type')}</TableHead>
                                <TableHead>{t('Address')}</TableHead>
                                <TableHead>{t('Entries')}</TableHead>
                                <TableHead className="text-end">
                                    {t('Actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {terms.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center text-muted-foreground"
                                    >
                                        {t('No categories or tags yet.')}
                                    </TableCell>
                                </TableRow>
                            )}
                            {terms.map((term) => (
                                <TableRow key={term.id}>
                                    <TableCell className="font-medium">
                                        {term.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {term.taxonomy === 'category'
                                                ? t('Category')
                                                : t('Tag')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        /blog?{term.taxonomy}={term.slug}
                                    </TableCell>
                                    <TableCell>{term.entriesCount}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label={t('Edit')}
                                                onClick={() => setEditing(term)}
                                            >
                                                <Pencil />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label={t('Delete')}
                                                onClick={() => remove(term)}
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
            </div>

            {editing && (
                <TermDialog
                    key={editing === 'new' ? 'new' : editing.id}
                    term={editing === 'new' ? null : editing}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    );
}

function TermDialog({
    term,
    onClose,
}: {
    term: Term | null;
    onClose: () => void;
}) {
    const t = useTrans();
    const form = useForm<{ taxonomy: Taxonomy; name: string; slug: string }>({
        taxonomy: term?.taxonomy ?? 'category',
        name: term?.name ?? '',
        slug: term?.slug ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => onClose() };

        if (term) {
            form.put(`/admin/cms/terms/${term.id}`, options);
        } else {
            form.post('/admin/cms/terms', options);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {term ? t('Edit term') : t('New term')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="term-taxonomy">{t('Type')}</Label>
                        <NativeSelect
                            id="term-taxonomy"
                            disabled={!!term}
                            value={form.data.taxonomy}
                            onChange={(e) =>
                                form.setData(
                                    'taxonomy',
                                    e.target.value as Taxonomy,
                                )
                            }
                        >
                            <NativeSelectOption value="category">
                                {t('Category')}
                            </NativeSelectOption>
                            <NativeSelectOption value="tag">
                                {t('Tag')}
                            </NativeSelectOption>
                        </NativeSelect>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="term-name">{t('Name')}</Label>
                        <Input
                            id="term-name"
                            required
                            maxLength={80}
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                        />
                        {form.errors.name && (
                            <p className="text-sm text-destructive">
                                {form.errors.name}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="term-slug">
                            {t('Address (optional)')}
                        </Label>
                        <Input
                            id="term-slug"
                            maxLength={80}
                            value={form.data.slug}
                            onChange={(e) =>
                                form.setData(
                                    'slug',
                                    e.target.value.toLowerCase(),
                                )
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            {t('Created from the name when left empty.')}
                        </p>
                        {form.errors.slug && (
                            <p className="text-sm text-destructive">
                                {form.errors.slug}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {t('Save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
