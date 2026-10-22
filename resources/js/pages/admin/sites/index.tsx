import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle } from 'lucide-react';
import { ExternalLink, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import PageHeader from '@/components/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    NativeSelect,
    NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useTrans } from '@/hooks/use-trans';

export type SiteRow = {
    id: number;
    name: string;
    slug: string;
    domain: string | null;
    locale: string;
    isDefault: boolean;
    description: string | null;
    homeSlug: string | null;
    publicUrl: string;
    contentCount: number;
    current: boolean;
};

type SiteForm = {
    name: string;
    slug: string;
    domain: string;
    locale: string;
    description: string;
    home_slug: string;
    is_default: boolean;
};

const LOCALE_LABELS: Record<string, string> = { en: 'English', de: 'Deutsch' };

// Every site the app publishes. Each site has its own pages, posts, categories, tags, calls to action, and SEO
// defaults. The default site serves the landing page and any address no other site claims.
export default function AdminSites({
    sites,
    locales,
}: {
    sites: SiteRow[];
    locales: string[];
}) {
    const t = useTrans();
    const { errors } = usePage().props;
    const [editing, setEditing] = useState<SiteRow | 'new' | null>(null);
    // Refused actions (deleting the default site, or a site that still has content) report here.
    const siteError = (errors as Record<string, string | undefined>).site;

    const remove = (site: SiteRow) => {
        if (
            window.confirm(
                t(
                    'Delete the site “:name”? Its content must be moved or deleted first.',
                    {
                        name: site.name,
                    },
                ),
            )
        ) {
            router.delete(`/admin/sites/${site.id}`, { preserveScroll: true });
        }
    };

    const makeDefault = (site: SiteRow) => {
        router.put(
            `/admin/sites/${site.id}`,
            {
                name: site.name,
                slug: site.slug,
                domain: site.domain ?? '',
                locale: site.locale,
                description: site.description ?? '',
                home_slug: site.homeSlug ?? '',
                is_default: true,
            },
            { preserveScroll: true },
        );
    };

    const columns = useMemo<ColumnDef<DataTableFeatures, SiteRow>[]>(
        () => [
            {
                accessorKey: 'name',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t('Name')} />
                ),
                cell: ({ row }) => (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{row.original.name}</span>
                        {row.original.isDefault && (
                            <Badge>{t('Default')}</Badge>
                        )}
                        {row.original.current && (
                            <Badge variant="outline">{t('Working on')}</Badge>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'slug',
                id: 'slug',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Address')}
                    />
                ),
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.domain ?? `/s/${row.original.slug}`}
                    </span>
                ),
            },
            {
                accessorKey: 'locale',
                id: 'locale',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Language')}
                    />
                ),
                cell: ({ row }) =>
                    LOCALE_LABELS[row.original.locale] ?? row.original.locale,
            },
            {
                accessorKey: 'contentCount',
                id: 'contentCount',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t('Content')}
                    />
                ),
                cell: ({ row }) => row.original.contentCount,
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">{t('Actions')}</span>,
                cell: ({ row }) => (
                    <div className="flex justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t('Open :name', {
                                name: row.original.name,
                            })}
                            render={
                                <a
                                    href={row.original.publicUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                />
                            }
                        >
                            <ExternalLink />
                        </Button>
                        {!row.original.isDefault && (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t('Make :name the default site', {
                                    name: row.original.name,
                                })}
                                onClick={() => makeDefault(row.original)}
                            >
                                <Star />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t('Edit :name', {
                                name: row.original.name,
                            })}
                            onClick={() => setEditing(row.original)}
                        >
                            <Pencil />
                        </Button>
                        {!row.original.isDefault && (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t('Delete :name', {
                                    name: row.original.name,
                                })}
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
        // eslint-disable-next-line @eslint-react/exhaustive-deps
        [t],
    );

    return (
        <>
            <Head title={t('Sites')} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Sites')}
                    description={t(
                        'Each site has its own pages, posts, categories, tags, calls to action and search settings. A site is reached by its own domain, or by /s/ and its address.',
                    )}
                    actions={
                        <Button size="sm" onClick={() => setEditing('new')}>
                            <Plus /> {t('New site')}
                        </Button>
                    }
                />

                {siteError && (
                    <Alert variant="destructive">
                        <AlertTriangle />
                        <AlertTitle>
                            {t('The site was not changed.')}
                        </AlertTitle>
                        <AlertDescription>{siteError}</AlertDescription>
                    </Alert>
                )}

                <DataTable<SiteRow>
                    columns={columns}
                    data={sites}
                    initialPageSize={20}
                    getRowId={(row) => String(row.id)}
                    emptyMessage={t('No sites yet.')}
                    toolbar={{
                        search: {
                            column: 'name',
                            placeholder: t('Search sites'),
                        },
                    }}
                />
            </div>

            {editing && (
                <SiteDialog
                    key={editing === 'new' ? 'new' : editing.id}
                    site={editing === 'new' ? null : editing}
                    locales={locales}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    );
}

function SiteDialog({
    site,
    locales,
    onClose,
}: {
    site: SiteRow | null;
    locales: string[];
    onClose: () => void;
}) {
    const t = useTrans();
    const form = useForm<SiteForm>({
        name: site?.name ?? '',
        slug: site?.slug ?? '',
        domain: site?.domain ?? '',
        locale: site?.locale ?? 'en',
        description: site?.description ?? '',
        home_slug: site?.homeSlug ?? '',
        is_default: site?.isDefault ?? false,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
        };

        if (site) {
            form.put(`/admin/sites/${site.id}`, options);
        } else {
            form.post('/admin/sites', options);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {site ? t('Edit site') : t('New site')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="site-name">
                                {t('Name')}
                            </FieldLabel>
                            <Input
                                id="site-name"
                                required
                                maxLength={120}
                                value={form.data.name}
                                aria-invalid={!!form.errors.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                            />
                            {form.errors.name && (
                                <p className="text-sm text-destructive">
                                    {form.errors.name}
                                </p>
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="site-slug">
                                {t('Address (slug)')}
                            </FieldLabel>
                            <Input
                                id="site-slug"
                                required
                                maxLength={40}
                                value={form.data.slug}
                                aria-invalid={!!form.errors.slug}
                                onChange={(e) =>
                                    form.setData(
                                        'slug',
                                        e.target.value.toLowerCase(),
                                    )
                                }
                            />
                            <FieldDescription>
                                {t(
                                    'Used in the path /s/{slug} when the site has no domain of its own.',
                                )}
                            </FieldDescription>
                            {form.errors.slug && (
                                <p className="text-sm text-destructive">
                                    {form.errors.slug}
                                </p>
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="site-domain">
                                {t('Domain (optional)')}
                            </FieldLabel>
                            <Input
                                id="site-domain"
                                placeholder="news.example.com"
                                maxLength={190}
                                value={form.data.domain}
                                aria-invalid={!!form.errors.domain}
                                onChange={(e) =>
                                    form.setData(
                                        'domain',
                                        e.target.value.toLowerCase(),
                                    )
                                }
                            />
                            <FieldDescription>
                                {t(
                                    'When set, visitors reach the site at this host name. Point its DNS at this app first.',
                                )}
                            </FieldDescription>
                            {form.errors.domain && (
                                <p className="text-sm text-destructive">
                                    {form.errors.domain}
                                </p>
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="site-locale">
                                {t('Language')}
                            </FieldLabel>
                            <NativeSelect
                                id="site-locale"
                                value={form.data.locale}
                                onChange={(e) =>
                                    form.setData('locale', e.target.value)
                                }
                            >
                                {locales.map((locale) => (
                                    <NativeSelectOption
                                        key={locale}
                                        value={locale}
                                    >
                                        {LOCALE_LABELS[locale] ?? locale}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="site-description">
                                {t('Description (for search engines)')}
                            </FieldLabel>
                            <Textarea
                                id="site-description"
                                rows={2}
                                maxLength={255}
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="site-home">
                                {t('Home page address (optional)')}
                            </FieldLabel>
                            <Input
                                id="site-home"
                                placeholder="about"
                                maxLength={160}
                                value={form.data.home_slug}
                                aria-invalid={!!form.errors.home_slug}
                                onChange={(e) =>
                                    form.setData(
                                        'home_slug',
                                        e.target.value.toLowerCase(),
                                    )
                                }
                            />
                            <FieldDescription>
                                {t(
                                    'The address of one of this site’s pages, shown as its home. Without it, the blog is the home page.',
                                )}
                            </FieldDescription>
                            {form.errors.home_slug && (
                                <p className="text-sm text-destructive">
                                    {form.errors.home_slug}
                                </p>
                            )}
                        </Field>
                        {!site?.isDefault && (
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={form.data.is_default}
                                    onCheckedChange={(checked) =>
                                        form.setData('is_default', !!checked)
                                    }
                                    aria-label={t('Make this the default site')}
                                />
                                {t('Make this the default site')}
                            </label>
                        )}
                    </FieldGroup>
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
