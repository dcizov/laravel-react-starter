import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
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
    contentType: string;
    taxonomy: Taxonomy;
    name: string;
    slug: string;
    entriesCount: number;
};

// A content type as the terms page needs it: its label, and which kinds of term it supports.
type TypeOption = { key: string; label: string; supports: string[] };

// Categories and tags belong to one content type each. Two types can both have a "News" category.
export default function CmsTerms({
    terms,
    types,
}: {
    terms: Term[];
    types: TypeOption[];
}) {
    const t = useTrans();
    const [editing, setEditing] = useState<Term | 'new' | null>(null);
    const [typeFilter, setTypeFilter] = useState('');

    const labelOf = useMemo(
        () => new Map(types.map((type) => [type.key, type.label])),
        [types],
    );

    const visible = typeFilter
        ? terms.filter((term) => term.contentType === typeFilter)
        : terms;

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
                        'Each content type has its own categories and tags. Pick a type to see its terms.',
                    )}
                    actions={
                        <Button size="sm" onClick={() => setEditing('new')}>
                            <Plus /> {t('New term')}
                        </Button>
                    }
                />

                <div className="flex flex-wrap items-end gap-2">
                    <div className="grid gap-2">
                        <Label htmlFor="terms-type-filter">
                            {t('Content type')}
                        </Label>
                        <NativeSelect
                            id="terms-type-filter"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <NativeSelectOption value="">
                                {t('All types')}
                            </NativeSelectOption>
                            {types.map((type) => (
                                <NativeSelectOption
                                    key={type.key}
                                    value={type.key}
                                >
                                    {type.label}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Name')}</TableHead>
                                <TableHead>{t('Content type')}</TableHead>
                                <TableHead>{t('Kind')}</TableHead>
                                <TableHead>{t('Address')}</TableHead>
                                <TableHead>{t('Entries')}</TableHead>
                                <TableHead className="text-end">
                                    {t('Actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center text-muted-foreground"
                                    >
                                        {t('No categories or tags yet.')}
                                    </TableCell>
                                </TableRow>
                            )}
                            {visible.map((term) => (
                                <TableRow key={term.id}>
                                    <TableCell className="font-medium">
                                        {term.name}
                                    </TableCell>
                                    <TableCell>
                                        {labelOf.get(term.contentType) ??
                                            term.contentType}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {term.taxonomy === 'category'
                                                ? t('Category')
                                                : t('Tag')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {archivePath(term)}
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
                    types={types}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    );
}

// The public archive a term filters: the blog for posts, otherwise the type's own archive.
function archivePath(term: Pick<Term, 'contentType' | 'taxonomy' | 'slug'>) {
    const base =
        term.contentType === 'post' ? '/blog' : `/content/${term.contentType}`;

    return `${base}?${term.taxonomy}=${term.slug}`;
}

function TermDialog({
    term,
    types,
    onClose,
}: {
    term: Term | null;
    types: TypeOption[];
    onClose: () => void;
}) {
    const t = useTrans();
    const form = useForm<{
        content_type: string;
        taxonomy: Taxonomy;
        name: string;
        slug: string;
    }>({
        content_type: term?.contentType ?? types[0]?.key ?? 'post',
        taxonomy: term?.taxonomy ?? 'category',
        name: term?.name ?? '',
        slug: term?.slug ?? '',
    });

    // Only the kinds of term the chosen type supports can be picked.
    const chosenType = types.find(
        (type) => type.key === form.data.content_type,
    );
    const kinds = (chosenType?.supports ?? []).filter(
        (kind): kind is Taxonomy => kind === 'category' || kind === 'tag',
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => onClose() };

        if (term) {
            // The type of an existing term does not change; see TermRequest.
            router.put(
                `/admin/cms/terms/${term.id}`,
                {
                    taxonomy: form.data.taxonomy,
                    name: form.data.name,
                    slug: form.data.slug,
                },
                options,
            );
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
                        <Label htmlFor="term-content-type">
                            {t('Content type')}
                        </Label>
                        <NativeSelect
                            id="term-content-type"
                            disabled={!!term}
                            value={form.data.content_type}
                            onChange={(e) => {
                                const next = types.find(
                                    (type) => type.key === e.target.value,
                                );
                                form.setData('content_type', e.target.value);
                                // Keep the kind valid for the new type.
                                if (
                                    next &&
                                    !next.supports.includes(form.data.taxonomy)
                                ) {
                                    form.setData(
                                        'taxonomy',
                                        next.supports.includes('category')
                                            ? 'category'
                                            : 'tag',
                                    );
                                }
                            }}
                        >
                            {types.map((type) => (
                                <NativeSelectOption
                                    key={type.key}
                                    value={type.key}
                                >
                                    {type.label}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                        {form.errors.content_type && (
                            <p className="text-sm text-destructive">
                                {form.errors.content_type}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="term-taxonomy">{t('Kind')}</Label>
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
                            {kinds.map((kind) => (
                                <NativeSelectOption key={kind} value={kind}>
                                    {kind === 'category'
                                        ? t('Category')
                                        : t('Tag')}
                                </NativeSelectOption>
                            ))}
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
