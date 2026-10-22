import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useTrans } from '@/hooks/use-trans';
import type { ContentTypeInfo, CustomFieldDef, FieldType } from '@/types/cms';

type Form = {
    key: string;
    label: string;
    singular_label: string;
    has_archive: boolean;
    supports: string[];
    fields: CustomFieldDef[];
};

const SUPPORT_LABELS: Record<string, string> = {
    excerpt: 'Summary',
    image: 'Featured image',
    category: 'Categories',
    tag: 'Tags',
    comments: 'Comments',
};

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
    text: 'Text',
    textarea: 'Long text',
    url: 'Link',
    number: 'Number',
    date: 'Date',
    boolean: 'Yes / no',
};

// The content types: pages, posts and any custom types. Each type sets its name, archive, features and custom fields.
export default function CmsTypes({
    types,
    supports,
    fieldTypes,
}: {
    types: ContentTypeInfo[];
    supports: string[];
    fieldTypes: FieldType[];
}) {
    const t = useTrans();
    const [editing, setEditing] = useState<ContentTypeInfo | 'new' | null>(
        null,
    );

    const remove = (type: ContentTypeInfo) => {
        if (
            window.confirm(
                t(
                    'Delete the type “:name” and all its entries? This cannot be undone.',
                    { name: type.label },
                ),
            )
        ) {
            router.delete(`/admin/cms/types/${type.key}`, {
                preserveScroll: true,
            });
        }
    };

    const columns = useMemo<ColumnDef<DataTableFeatures, ContentTypeInfo>[]>(
        () => [
            {
                accessorKey: 'label',
                id: 'label',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t('Name')} />
                ),
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.original.label}
                        {row.original.builtin && (
                            <Badge variant="outline" className="ms-2">
                                {t('Built in')}
                            </Badge>
                        )}
                    </span>
                ),
            },
            {
                id: 'address',
                header: () => t('Address'),
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        /
                        {row.original.key === 'page'
                            ? 'pages'
                            : row.original.key === 'post'
                              ? 'blog'
                              : `content/${row.original.key}`}
                    </span>
                ),
                enableSorting: false,
            },
            {
                id: 'origin',
                accessorFn: (row) => (row.builtin ? 'built-in' : 'custom'),
                header: () => null,
                cell: () => null,
                enableSorting: false,
            },
            {
                id: 'features',
                header: () => t('Features'),
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-1">
                        {row.original.supports.map((item) => (
                            <Badge key={item} variant="secondary">
                                {t(SUPPORT_LABELS[item] ?? item)}
                            </Badge>
                        ))}
                        {row.original.hasArchive && (
                            <Badge variant="secondary">{t('Archive')}</Badge>
                        )}
                        {row.original.fields.length > 0 && (
                            <Badge variant="secondary">
                                {t(':count fields', {
                                    count: row.original.fields.length,
                                })}
                            </Badge>
                        )}
                    </div>
                ),
                enableSorting: false,
            },
            {
                accessorKey: 'entriesCount',
                id: 'entriesCount',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Entries')}
                    />
                ),
                cell: ({ row }) => row.original.entriesCount,
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">{t('Actions')}</span>,
                cell: ({ row }) => (
                    <div className="flex justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            render={
                                <Link
                                    href={`/admin/content/${row.original.key}`}
                                />
                            }
                            nativeButton={false}
                        >
                            {t('Entries')}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t('Edit')}
                            onClick={() => setEditing(row.original)}
                        >
                            <Pencil />
                        </Button>
                        {!row.original.builtin && (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t('Delete')}
                                onClick={() => remove(row.original)}
                            >
                                <Trash2 />
                            </Button>
                        )}
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [t],
    );

    return (
        <>
            <Head title={t('Content types')} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Content types')}
                    description={t(
                        'Pages, posts and your own types, each with its own custom fields.',
                    )}
                    actions={
                        <Button size="sm" onClick={() => setEditing('new')}>
                            <Plus /> {t('New type')}
                        </Button>
                    }
                />

                <DataTable<ContentTypeInfo>
                    columns={columns}
                    data={types}
                    initialPageSize={20}
                    getRowId={(row) => row.key}
                    hiddenColumns={['origin']}
                    emptyMessage={t('No content types yet.')}
                    toolbar={{
                        search: {
                            column: 'label',
                            placeholder: t('Search names'),
                        },
                        filters: [
                            {
                                column: 'origin',
                                title: t('Kind'),
                                options: [
                                    { label: t('Built in'), value: 'built-in' },
                                    { label: t('Custom'), value: 'custom' },
                                ],
                            },
                        ],
                    }}
                />
            </div>

            {editing && (
                <TypeDialog
                    key={editing === 'new' ? 'new' : editing.key}
                    type={editing === 'new' ? null : editing}
                    supports={supports}
                    fieldTypes={fieldTypes}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    );
}

function TypeDialog({
    type,
    supports,
    fieldTypes,
    onClose,
}: {
    type: ContentTypeInfo | null;
    supports: string[];
    fieldTypes: FieldType[];
    onClose: () => void;
}) {
    const t = useTrans();
    const form = useForm<Form>({
        key: type?.key ?? '',
        label: type?.label ?? '',
        singular_label: type?.singular ?? '',
        has_archive: type?.hasArchive ?? false,
        supports: type?.supports ?? [],
        fields: type?.fields ?? [],
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
        };

        if (type) {
            form.put(`/admin/cms/types/${type.key}`, options);
        } else {
            form.post('/admin/cms/types', options);
        }
    };

    const setField = (index: number, changes: Partial<CustomFieldDef>) => {
        form.setData(
            'fields',
            form.data.fields.map((field, i) =>
                i === index ? { ...field, ...changes } : field,
            ),
        );
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {type
                            ? t('Edit :name', { name: type.label })
                            : t('New content type')}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="type-label">
                                {t('Name (plural)')}
                            </Label>
                            <Input
                                id="type-label"
                                required
                                maxLength={80}
                                value={form.data.label}
                                onChange={(e) =>
                                    form.setData('label', e.target.value)
                                }
                            />
                            {form.errors.label && (
                                <p className="text-sm text-destructive">
                                    {form.errors.label}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="type-singular">
                                {t('Name (singular)')}
                            </Label>
                            <Input
                                id="type-singular"
                                required
                                maxLength={80}
                                value={form.data.singular_label}
                                onChange={(e) =>
                                    form.setData(
                                        'singular_label',
                                        e.target.value,
                                    )
                                }
                            />
                            {form.errors.singular_label && (
                                <p className="text-sm text-destructive">
                                    {form.errors.singular_label}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="type-key">{t('Address (key)')}</Label>
                        <Input
                            id="type-key"
                            disabled={!!type}
                            required={!type}
                            maxLength={40}
                            pattern="[a-z][a-z0-9-]{1,39}"
                            value={form.data.key}
                            onChange={(e) =>
                                form.setData(
                                    'key',
                                    e.target.value.toLowerCase(),
                                )
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            {type
                                ? t(
                                      'The address cannot be changed after creation.',
                                  )
                                : t(
                                      'Lowercase letters, numbers and dashes. The entries are at /content/:key/…',
                                      { key: form.data.key || 'key' },
                                  )}
                        </p>
                        {form.errors.key && (
                            <p className="text-sm text-destructive">
                                {form.errors.key}
                            </p>
                        )}
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                            checked={form.data.has_archive}
                            onCheckedChange={(checked) =>
                                form.setData('has_archive', checked === true)
                            }
                        />
                        {t('Show an archive page listing the entries')}
                    </label>

                    <fieldset className="flex flex-col gap-2">
                        <legend className="mb-1 text-sm font-medium">
                            {t('Features')}
                        </legend>
                        {supports.map((item) => (
                            <label
                                key={item}
                                className="flex items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    checked={form.data.supports.includes(item)}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            'supports',
                                            checked === true
                                                ? [...form.data.supports, item]
                                                : form.data.supports.filter(
                                                      (s) => s !== item,
                                                  ),
                                        )
                                    }
                                />
                                {t(SUPPORT_LABELS[item] ?? item)}
                            </label>
                        ))}
                    </fieldset>

                    <fieldset className="flex flex-col gap-3">
                        <legend className="mb-1 text-sm font-medium">
                            {t('Custom fields')}
                        </legend>
                        {/* The field key is typed by the user and changes as they type, so the row position is the stable key. */}
                        {form.data.fields.map((field, index) => (
                            <div
                                // eslint-disable-next-line @eslint-react/no-array-index-key
                                key={index}
                                className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_9rem_auto] sm:items-end"
                            >
                                <div className="grid gap-1">
                                    <Label className="text-xs">
                                        {t('Label')}
                                    </Label>
                                    <Input
                                        value={field.label}
                                        maxLength={80}
                                        onChange={(e) =>
                                            setField(index, {
                                                label: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label className="text-xs">
                                        {t('Key')}
                                    </Label>
                                    <Input
                                        value={field.key}
                                        maxLength={40}
                                        onChange={(e) =>
                                            setField(index, {
                                                key: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label className="text-xs">
                                        {t('Type')}
                                    </Label>
                                    <NativeSelect
                                        value={field.type}
                                        onChange={(e) =>
                                            setField(index, {
                                                type: e.target
                                                    .value as FieldType,
                                            })
                                        }
                                    >
                                        {fieldTypes.map((item) => (
                                            <NativeSelectOption
                                                key={item}
                                                value={item}
                                            >
                                                {t(FIELD_TYPE_LABELS[item])}
                                            </NativeSelectOption>
                                        ))}
                                    </NativeSelect>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={t('Remove field')}
                                    onClick={() =>
                                        form.setData(
                                            'fields',
                                            form.data.fields.filter(
                                                (_, i) => i !== index,
                                            ),
                                        )
                                    }
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        ))}
                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    form.setData('fields', [
                                        ...form.data.fields,
                                        { key: '', label: '', type: 'text' },
                                    ])
                                }
                            >
                                <Plus /> {t('Add field')}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t(
                                'A field key is fixed once entries use it. Use lowercase letters, numbers and underscores.',
                            )}
                        </p>
                        {Object.entries(form.errors)
                            .filter(([k]) => k.startsWith('fields'))
                            .map(([k, message]) => (
                                <p key={k} className="text-sm text-destructive">
                                    {message}
                                </p>
                            ))}
                    </fieldset>

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
