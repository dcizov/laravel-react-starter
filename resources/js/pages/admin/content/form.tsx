import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useId, useState } from 'react';
import BlockEditor from '@/components/cms/block-editor';
import { publicPath } from '@/components/cms/public-path';
import { ImageField } from '@/components/image-field';
import PageHeader from '@/components/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { formatDateTime } from '@/components/users/data';
import { useTrans } from '@/hooks/use-trans';
import type {
    ContentBlock,
    ContentTypeInfo,
    CtaOption,
    CustomFieldDef,
    TermOption,
} from '@/types/cms';

type EntryData = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImage: string | null;
    status: 'draft' | 'published';
    publishedAt: string | null;
    customFields: Record<string, string | number | boolean | null>;
    seo: { title: string | null; description: string | null; noindex: boolean };
    termIds: number[];
    blocks: ContentBlock[];
    url: string | null;
};

type EntryForm = {
    title: string;
    slug: string;
    excerpt: string;
    featured_image: string;
    status: 'draft' | 'published';
    published_at: string;
    term_ids: number[];
    custom_fields: Record<string, string | number | boolean | null>;
    seo: { title: string; description: string; noindex: boolean };
    body: ContentBlock[];
};

// Turns an ISO date into the value a datetime-local input expects, in the editor's own time zone.
function toLocalInput(iso: string | null): string {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// The form for creating and editing an entry. Only the sections the content type supports are shown.
type Revision = {
    id: number;
    title: string;
    status: 'draft' | 'published';
    author: string | null;
    createdAt: string | null;
};

// The entry form. The server decides what the admin may do: the can flags turn off publishing, deleting and
// editing, and a trashed entry is read-only until it is restored.
export default function ContentEntryForm({
    type,
    entry,
    terms,
    ctas,
    statuses,
    trashed,
    can,
    revisions,
    previewUrl,
}: {
    type: ContentTypeInfo;
    entry: EntryData | null;
    terms: TermOption[];
    ctas: CtaOption[];
    statuses: string[];
    trashed: boolean;
    can: {
        publish: boolean;
        update: boolean;
        delete: boolean;
        restore: boolean;
    };
    revisions: Revision[];
    previewUrl: string;
}) {
    const t = useTrans();
    const { timezone } = usePage().props;
    const base = `/admin/content/${type.key}`;
    const supports = (feature: string) => type.supports.includes(feature);
    // The status can only change when the admin may publish. An author can still save a live entry as it is.
    const statusLocked = !can.publish;
    const statusOptions = statuses.filter(
        (status) => can.publish || status === entry?.status,
    );
    const readOnly = trashed || !can.update;
    const [previewing, setPreviewing] = useState(false);

    const form = useForm<EntryForm>({
        title: entry?.title ?? '',
        slug: entry?.slug ?? '',
        excerpt: entry?.excerpt ?? '',
        featured_image: entry?.featuredImage ?? '',
        status: entry?.status ?? 'draft',
        published_at: toLocalInput(entry?.publishedAt ?? null),
        term_ids: entry?.termIds ?? [],
        custom_fields: entry?.customFields ?? {},
        seo: {
            title: entry?.seo.title ?? '',
            description: entry?.seo.description ?? '',
            noindex: entry?.seo.noindex ?? false,
        },
        body: entry?.blocks ?? [],
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (entry) {
            form.put(`${base}/${entry.id}`, { preserveScroll: true });
        } else {
            form.post(base);
        }
    };

    // Opens the entry as it would look on the site, from the values on the form. Nothing is saved.
    const preview = async () => {
        setPreviewing(true);

        try {
            const response = await fetch(previewUrl, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken(),
                },
                body: JSON.stringify(form.data),
                credentials: 'same-origin',
            });

            if (response.status === 422) {
                const body = (await response.json()) as {
                    errors?: Record<string, string[]>;
                };
                const errors = Object.fromEntries(
                    Object.entries(body.errors ?? {}).map(([key, messages]) => [
                        key,
                        messages[0],
                    ]),
                );

                form.setError(errors);

                return;
            }

            if (!response.ok) {
                throw new Error(String(response.status));
            }

            const body = (await response.json()) as { url: string };

            window.open(body.url, '_blank', 'noopener,noreferrer');
        } catch {
            form.setError(
                'title',
                t('The preview could not be opened. Try again.'),
            );
        } finally {
            setPreviewing(false);
        }
    };

    const trash = () => {
        if (
            entry &&
            window.confirm(
                t('Move “:title” to the trash? You can restore it later.', {
                    title: entry.title,
                }),
            )
        ) {
            router.delete(`${base}/${entry.id}`);
        }
    };

    const restoreEntry = () => {
        if (entry) {
            router.post(
                `${base}/${entry.id}/restore`,
                {},
                { preserveScroll: true },
            );
        }
    };

    const restoreRevision = (revision: Revision) => {
        if (
            entry &&
            window.confirm(
                t(
                    'Restore the version from :date? The current version is saved first, so this can be undone.',
                    {
                        date: formatDateTime(revision.createdAt, timezone),
                    },
                ),
            )
        ) {
            router.post(
                `${base}/${entry.id}/revisions/${revision.id}/restore`,
                {},
                { preserveScroll: true },
            );
        }
    };

    const setField = (key: string, value: string | number | boolean | null) =>
        form.setData('custom_fields', {
            ...form.data.custom_fields,
            [key]: value,
        });

    const toggleTerm = (id: number, checked: boolean) => {
        form.setData(
            'term_ids',
            checked
                ? [...form.data.term_ids, id]
                : form.data.term_ids.filter((termId) => termId !== id),
        );
    };

    const termsOf = (taxonomy: 'category' | 'tag') =>
        terms.filter((term) => term.taxonomy === taxonomy);

    return (
        <>
            <Head
                title={
                    entry
                        ? form.data.title || type.singular
                        : `${t('New :type', { type: type.singular })}`
                }
            />
            <form
                onSubmit={submit}
                className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-4 md:p-6"
            >
                <PageHeader
                    title={
                        entry
                            ? t('Edit :type', { type: type.singular })
                            : t('New :type', { type: type.singular })
                    }
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {entry?.url && (
                                <a
                                    href={entry.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={buttonVariants({
                                        variant: 'outline',
                                        size: 'sm',
                                    })}
                                >
                                    {t('View')}
                                    <span className="sr-only">
                                        {t('(opens in a new tab)')}
                                    </span>
                                </a>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={previewing || form.processing}
                                onClick={preview}
                            >
                                {t('Preview')}
                            </Button>
                            {entry && can.delete && !trashed && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={trash}
                                >
                                    {t('Move to trash')}
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={form.processing || readOnly}
                            >
                                {form.processing ? t('Saving…') : t('Save')}
                            </Button>
                            {form.recentlySuccessful && (
                                <span
                                    role="status"
                                    className="text-sm text-muted-foreground"
                                >
                                    {t('Saved.')}
                                </span>
                            )}
                        </div>
                    }
                />

                {trashed && (
                    <Alert>
                        <AlertTitle>
                            {t('This entry is in the trash.')}
                        </AlertTitle>
                        <AlertDescription className="flex flex-wrap items-center gap-3">
                            <span>
                                {t(
                                    'It is not shown on the site. Restore it to edit it again.',
                                )}
                            </span>
                            {can.restore && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={restoreEntry}
                                >
                                    {t('Restore')}
                                </Button>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                <fieldset
                    disabled={readOnly}
                    className="flex min-w-0 flex-col gap-8 disabled:opacity-70"
                >
                    <Section title={t('Content')}>
                        <FieldGroup>
                            <TextInput
                                id="title"
                                label={t('Title')}
                                value={form.data.title}
                                onChange={(v) => form.setData('title', v)}
                                error={form.errors.title}
                                required
                                max={160}
                            />
                            <TextInput
                                id="slug"
                                label={t('Address (slug)')}
                                value={form.data.slug}
                                onChange={(v) => form.setData('slug', v)}
                                error={form.errors.slug}
                                max={160}
                                hint={`${publicPath(type.key, form.data.slug || '…')}`}
                            />
                            {supports('excerpt') && (
                                <Field>
                                    <FieldLabel htmlFor="excerpt">
                                        {t('Summary')}
                                    </FieldLabel>
                                    <Textarea
                                        id="excerpt"
                                        rows={2}
                                        maxLength={500}
                                        value={form.data.excerpt}
                                        onChange={(e) =>
                                            form.setData(
                                                'excerpt',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            )}
                            {supports('image') && (
                                <ImageField
                                    endpoint="/admin/cms/images"
                                    label={t('Featured image')}
                                    value={form.data.featured_image}
                                    onChange={(url) =>
                                        form.setData('featured_image', url)
                                    }
                                    onError={(message) =>
                                        form.setError('featured_image', message)
                                    }
                                />
                            )}
                        </FieldGroup>
                    </Section>

                    <Section title={t('Body')}>
                        <BlockEditor
                            blocks={form.data.body}
                            onChange={(blocks) => form.setData('body', blocks)}
                            ctas={ctas}
                            uploadEndpoint="/admin/cms/images"
                            onError={(message) =>
                                form.setError('body', message)
                            }
                            errors={form.errors}
                        />
                        {form.errors.body && (
                            <p className="text-sm text-destructive">
                                {form.errors.body}
                            </p>
                        )}
                    </Section>

                    {(supports('category') || supports('tag')) && (
                        <Section title={t('Categories and tags')}>
                            {supports('category') && (
                                <TermPicker
                                    label={t('Categories')}
                                    terms={termsOf('category')}
                                    selected={form.data.term_ids}
                                    onToggle={toggleTerm}
                                />
                            )}
                            {supports('tag') && (
                                <TermPicker
                                    label={t('Tags')}
                                    terms={termsOf('tag')}
                                    selected={form.data.term_ids}
                                    onToggle={toggleTerm}
                                />
                            )}
                        </Section>
                    )}

                    {type.fields.length > 0 && (
                        <Section title={t('Details')}>
                            <FieldGroup>
                                {type.fields.map((field) => (
                                    <CustomField
                                        key={field.key}
                                        field={field}
                                        value={
                                            form.data.custom_fields[
                                                field.key
                                            ] ?? null
                                        }
                                        onChange={(v) => setField(field.key, v)}
                                    />
                                ))}
                            </FieldGroup>
                        </Section>
                    )}

                    <Section title={t('Publishing')}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="status">
                                    {t('Status')}
                                </FieldLabel>
                                <NativeSelect
                                    id="status"
                                    value={form.data.status}
                                    disabled={statusLocked}
                                    onChange={(e) =>
                                        form.setData(
                                            'status',
                                            e.target
                                                .value as EntryForm['status'],
                                        )
                                    }
                                >
                                    {statusOptions.map((status) => (
                                        <NativeSelectOption
                                            key={status}
                                            value={status}
                                        >
                                            {status === 'draft'
                                                ? t('Draft')
                                                : t('Published')}
                                        </NativeSelectOption>
                                    ))}
                                </NativeSelect>
                                {statusLocked && (
                                    <FieldDescription>
                                        {t(
                                            'You need permission to publish or unpublish content. Ask an editor to publish it.',
                                        )}
                                    </FieldDescription>
                                )}
                                {form.errors.status && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.status}
                                    </p>
                                )}
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="published_at">
                                    {t('Publish at')}
                                </FieldLabel>
                                <Input
                                    id="published_at"
                                    type="datetime-local"
                                    value={form.data.published_at}
                                    onChange={(e) =>
                                        form.setData(
                                            'published_at',
                                            e.target.value,
                                        )
                                    }
                                />
                                <FieldDescription>
                                    {t(
                                        'Leave empty to publish now. A future date schedules the entry.',
                                    )}
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </Section>

                    <Section title={t('Search and sharing')}>
                        <FieldGroup>
                            <TextInput
                                id="seo_title"
                                label={t('Search title (optional)')}
                                value={form.data.seo.title}
                                onChange={(v) =>
                                    form.setData('seo', {
                                        ...form.data.seo,
                                        title: v,
                                    })
                                }
                                max={70}
                                error={form.errors['seo.title']}
                            />
                            <TextInput
                                id="seo_description"
                                label={t('Search description (optional)')}
                                value={form.data.seo.description}
                                onChange={(v) =>
                                    form.setData('seo', {
                                        ...form.data.seo,
                                        description: v,
                                    })
                                }
                                max={180}
                                error={form.errors['seo.description']}
                            />
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={form.data.seo.noindex}
                                    onCheckedChange={(checked) =>
                                        form.setData('seo', {
                                            ...form.data.seo,
                                            noindex: checked === true,
                                        })
                                    }
                                />
                                {t('Hide from search engines')}
                            </label>
                        </FieldGroup>
                    </Section>
                </fieldset>

                {entry && revisions.length > 0 && (
                    <Section title={t('Earlier versions')}>
                        <p className="text-sm text-muted-foreground">
                            {t(
                                'Each change saves the version before it. Restoring one replaces the current content and saves the current version too.',
                            )}
                        </p>
                        <ul className="divide-y rounded-md border">
                            {revisions.map((revision) => (
                                <li
                                    key={revision.id}
                                    className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm"
                                >
                                    <div className="flex min-w-0 flex-col">
                                        <span className="truncate font-medium">
                                            {revision.title}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDateTime(
                                                revision.createdAt,
                                                timezone,
                                            )}
                                            {revision.author
                                                ? ` · ${revision.author}`
                                                : ''}
                                            {' · '}
                                            {revision.status === 'published'
                                                ? t('Published')
                                                : t('Draft')}
                                        </span>
                                    </div>
                                    {can.update && !trashed && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                restoreRevision(revision)
                                            }
                                        >
                                            {t('Restore this version')}
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </Section>
                )}
            </form>
        </>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="flex flex-col gap-4 rounded-xl border p-5">
            <h2 className="text-lg font-semibold">{title}</h2>
            {children}
        </section>
    );
}

function TextInput({
    id,
    label,
    value,
    onChange,
    error,
    required,
    max,
    hint,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
    max?: number;
    hint?: string;
}) {
    return (
        <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Input
                id={id}
                value={value}
                required={required}
                maxLength={max}
                onChange={(e) => onChange(e.target.value)}
                aria-invalid={error ? true : undefined}
            />
            {hint && <FieldDescription>{hint}</FieldDescription>}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </Field>
    );
}

function TermPicker({
    label,
    terms,
    selected,
    onToggle,
}: {
    label: string;
    terms: TermOption[];
    selected: number[];
    onToggle: (id: number, checked: boolean) => void;
}) {
    const id = useId();
    const t = useTrans();

    if (terms.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                {label}: {t('None yet. Add them under Categories and tags.')}
            </p>
        );
    }

    return (
        <fieldset className="flex flex-col gap-2" id={id}>
            <legend className="mb-1 text-sm font-medium">{label}</legend>
            <div className="flex flex-wrap gap-4">
                {terms.map((term) => (
                    <label
                        key={term.id}
                        className="flex items-center gap-2 text-sm"
                    >
                        <Checkbox
                            checked={selected.includes(term.id)}
                            onCheckedChange={(checked) =>
                                onToggle(term.id, checked === true)
                            }
                        />
                        {term.name}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

function CustomField({
    field,
    value,
    onChange,
}: {
    field: CustomFieldDef;
    value: string | number | boolean | null;
    onChange: (value: string | number | boolean | null) => void;
}) {
    const id = useId();

    if (field.type === 'boolean') {
        return (
            <label className="flex items-center gap-2 text-sm">
                <Checkbox
                    checked={value === true}
                    onCheckedChange={(checked) => onChange(checked === true)}
                />
                {field.label}
            </label>
        );
    }

    const stringValue =
        value === null || value === undefined ? '' : String(value);

    return (
        <Field>
            <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
            {field.type === 'textarea' ? (
                <Textarea
                    id={id}
                    rows={3}
                    value={stringValue}
                    onChange={(e) => onChange(e.target.value)}
                />
            ) : (
                <Input
                    id={id}
                    type={
                        field.type === 'number'
                            ? 'number'
                            : field.type === 'date'
                              ? 'date'
                              : field.type === 'url'
                                ? 'url'
                                : 'text'
                    }
                    value={stringValue}
                    onChange={(e) =>
                        onChange(e.target.value === '' ? null : e.target.value)
                    }
                />
            )}
        </Field>
    );
}

// The XSRF token Laravel sets as a cookie. fetch() needs it sent back as a header, as Inertia does for its own requests.
function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}
