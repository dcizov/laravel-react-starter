import { Head, Link, router, useHttp } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    ChevronDown,
    ChevronUp,
    Clock,
    Eye,
    GripVertical,
    History,
    Plus,
    Rocket,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBreadcrumbs } from '@/components/breadcrumbs-context';
import { FieldControl } from '@/components/sections/field-control';
import { SectionRenderer } from '@/components/sections/section-renderer';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { blockIndexFromErrorKey, sectionDef } from '@/lib/sections';
import type { PageStatus, SectionBlock, SectionDef } from '@/lib/sections';
import { cn } from '@/lib/utils';

type PageRecord = {
    id: number;
    title: string;
    slug: string;
    status: PageStatus;
    excerpt: string | null;
    seo_title: string | null;
    seo_description: string | null;
    robots: string;
    template: string;
    content: SectionBlock[];
    published_at: string | null;
    scheduled_at: string | null;
    updated_at: string | null;
    version: number;
    urls: Record<string, string | null>;
};

type Revision = {
    id: number;
    label: string | null;
    title: string;
    user: string | null;
    created_at: string | null;
    restore_url: string;
};

type Props = {
    page: PageRecord | null;
    sections: SectionDef[];
    draft?: {
        title: string;
        slug: string;
        excerpt: string;
        seo_title: string;
        seo_description: string;
        robots: string;
        template: string;
        content: SectionBlock[];
    };
    revisions?: Revision[];
    urls: Record<string, string>;
    can: { update?: boolean; publish: boolean; delete?: boolean };
};

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';

/** Repeater rows serialize as plain objects, so one level of nesting is enough. */
type ContentRow = Record<string, string | number | boolean | null>;
type ContentValue =
    | string
    | number
    | boolean
    | null
    | ContentRow
    | ContentRow[]
    | (string | number | boolean)[];

type PagePayload = {
    title: string;
    slug: string;
    excerpt: string;
    seo_title: string;
    seo_description: string;
    robots: string;
    content: {
        id: string;
        section: string;
        enabled: boolean;
        content: Record<string, ContentValue>;
    }[];
};

const emptyBlock = (section: SectionDef): SectionBlock => ({
    id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `block-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    section: section.key,
    enabled: true,
    content: { ...section.defaults },
});

export default function PageEditor({
    page,
    sections,
    draft,
    revisions = [],
    urls,
    can,
}: Props) {
    const isNew = page === null;

    const [title, setTitle] = useState(page?.title ?? draft?.title ?? '');
    const [slug, setSlug] = useState(page?.slug ?? draft?.slug ?? '');
    const [excerpt, setExcerpt] = useState(
        page?.excerpt ?? draft?.excerpt ?? '',
    );
    const [seoTitle, setSeoTitle] = useState(
        page?.seo_title ?? draft?.seo_title ?? '',
    );
    const [seoDescription, setSeoDescription] = useState(
        page?.seo_description ?? draft?.seo_description ?? '',
    );
    const [robots, setRobots] = useState(
        page?.robots ?? draft?.robots ?? 'index,follow',
    );
    const [blocks, setBlocks] = useState<SectionBlock[]>(
        page?.content ?? draft?.content ?? [],
    );
    const [status, setStatus] = useState<PageStatus>(page?.status ?? 'draft');

    const [selectedId, setSelectedId] = useState<string | null>(
        (page?.content ?? draft?.content ?? [])[0]?.id ?? null,
    );
    const [saveState, setSaveState] = useState<SaveState>('saved');
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(
        page?.updated_at ?? null,
    );
    const [seoOpen, setSeoOpen] = useState(false);
    const [revisionsOpen, setRevisionsOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [scheduleAt, setScheduleAt] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [pendingSection, setPendingSection] = useState<string | null>(null);

    const saveUrl = isNew ? urls.store : urls.update;
    const autosaveUrl = isNew ? null : urls.autosave;

    const payload = useMemo<PagePayload>(
        () => ({
            title,
            slug,
            excerpt,
            seo_title: seoTitle,
            seo_description: seoDescription,
            robots,
            // Section content is free-form JSON; the registry validates it server-side.
            content: blocks.map((block) => ({
                id: block.id,
                section: block.section,
                enabled: block.enabled,
                content: block.content as unknown as Record<
                    string,
                    ContentValue
                >,
            })),
        }),
        [title, slug, excerpt, seoTitle, seoDescription, robots, blocks],
    );

    /**
     * Autosave: Inertia v3 `useHttp` keeps the request out of the page visit
     * pipeline, so typing never causes a navigation.
     */
    /**
     * The version the server had when this editor last heard from it. It goes
     * with every save, and the server refuses the write when someone else has
     * saved in the meantime — a client-side abort alone cannot promise that an
     * in-flight request never lands.
     */
    const [version, setVersion] = useState<number | null>(
        page?.version ?? null,
    );
    const versionRef = useRef(version);
    versionRef.current = version;

    /** Monotonic id per request; only the newest answer may touch the UI. */
    const seqRef = useRef(0);

    const autosave = useHttp<
        PagePayload & { base_version: number | null },
        { saved_at: string; version: number }
    >('patch', autosaveUrl ?? urls.store, () => ({
        ...payload,
        base_version: versionRef.current,
    }));

    const selected = blocks.find((block) => block.id === selectedId) ?? null;
    const selectedDef = selected
        ? sectionDef(sections, selected.section)
        : undefined;

    const touchedRef = useRef(false);

    const markDirty = () => {
        touchedRef.current = true;
        setSaveState('dirty');
    };

    const applyErrors = useCallback(
        (errors: Record<string, string>) => {
            setFieldErrors(errors);

            const firstBlockKey = Object.keys(errors).find(
                (key) => blockIndexFromErrorKey(key) !== null,
            );

            if (firstBlockKey) {
                const index = blockIndexFromErrorKey(firstBlockKey);

                if (index !== null && blocks[index]) {
                    setSelectedId(blocks[index].id);
                    setPendingSection(blocks[index].id);
                }
            }
        },
        [blocks],
    );

    useEffect(() => {
        if (!autosaveUrl || !touchedRef.current) {
            return;
        }

        const timer = setTimeout(() => {
            const seq = ++seqRef.current;

            setSaveState('saving');

            autosave.patch(autosaveUrl, {
                onStart: () => setSaveState('saving'),
                onSuccess: (response) => {
                    // A slow save that finished after a newer one must not
                    // overwrite the newer answer — neither here nor on the server.
                    if (seq !== seqRef.current) {
                        return;
                    }

                    setVersion(response.version);
                    setSaveState('saved');
                    setLastSavedAt(new Date().toISOString());
                    setFieldErrors({});
                },
                onError: (errors) => {
                    if (seq !== seqRef.current) {
                        return;
                    }

                    applyErrors(errors as Record<string, string>);
                    setSaveState('error');
                },
            });
        }, 1500);

        return () => clearTimeout(timer);
        // `autosave` is a fresh hook object on every render; keying the debounce
        // on the payload alone is what prevents a save loop.
        // eslint-disable-next-line @eslint-react/exhaustive-deps
    }, [payload]);

    useEffect(() => {
        if (pendingSection === null) {
            return;
        }

        const element = document.getElementById(`block-${pendingSection}`);

        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        const timer = setTimeout(() => setPendingSection(null), 2500);

        return () => clearTimeout(timer);
    }, [pendingSection]);

    useEffect(() => {
        if (saveState !== 'dirty' && saveState !== 'saving') {
            return;
        }

        const warn = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', warn);

        return () => window.removeEventListener('beforeunload', warn);
    }, [saveState]);

    const updateSelectedContent = (key: string, value: unknown) => {
        if (!selected) {
            return;
        }

        setBlocks((current) =>
            current.map((block) =>
                block.id === selected.id
                    ? { ...block, content: { ...block.content, [key]: value } }
                    : block,
            ),
        );
        markDirty();
    };

    const addBlock = (section: SectionDef) => {
        const block = emptyBlock(section);
        setBlocks((current) => [...current, block]);
        setSelectedId(block.id);
        markDirty();
    };

    const moveBlock = (index: number, direction: -1 | 1) => {
        const target = index + direction;

        if (target < 0 || target >= blocks.length) {
            return;
        }

        const next = [...blocks];
        [next[index], next[target]] = [next[target], next[index]];
        setBlocks(next);
        markDirty();
    };

    const removeBlock = (id: string) => {
        setBlocks((current) => current.filter((block) => block.id !== id));

        if (selectedId === id) {
            setSelectedId(blocks.find((block) => block.id !== id)?.id ?? null);
        }

        markDirty();
    };

    const toggleBlock = (id: string) => {
        setBlocks((current) =>
            current.map((block) =>
                block.id === id ? { ...block, enabled: !block.enabled } : block,
            ),
        );
        markDirty();
    };

    const save = () => {
        if (isNew) {
            router.post(urls.store, payload, {
                onError: (errors) => applyErrors(errors),
            });

            return;
        }

        router.patch(saveUrl, payload, {
            preserveScroll: true,
            onSuccess: () => {
                setSaveState('saved');
                setLastSavedAt(new Date().toISOString());
            },
            onError: (errors) => applyErrors(errors),
        });
    };

    const publish = () => {
        if (!page) {
            return;
        }

        // Publish validates server-side; invalid sections are surfaced in place.
        router.post(
            page.urls.publish as string,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setStatus('published');
                    setFieldErrors({});
                },
                onError: (errors) => applyErrors(errors),
            },
        );
    };

    const unpublish = () => {
        if (!page) {
            return;
        }

        router.post(
            page.urls.unpublish as string,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setStatus('draft'),
            },
        );
    };

    const schedule = () => {
        if (!page) {
            return;
        }

        router.post(
            page.urls.schedule as string,
            { scheduled_at: scheduleAt },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setStatus('scheduled');
                    setScheduleOpen(false);
                },
            },
        );
    };

    const previewDisabled = isNew || !page?.urls.preview;

    const saveLabel = {
        saved: lastSavedAt
            ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'All changes saved',
        dirty: 'Unsaved changes',
        saving: 'Saving…',
        error: 'Could not save',
    }[saveState];

    useBreadcrumbs([
        { title: 'Content', href: '/admin/pages' },
        { title: 'Pages', href: '/admin/pages' },
        { title: isNew ? 'New page' : title || 'Untitled', href: '#' },
    ]);

    return (
        <>
            <Head title={isNew ? 'New page' : `Edit · ${title}`} />

            <div className="space-y-5">
                <div className="flex flex-col gap-3 border-b border-border/60 pb-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            asChild
                        >
                            <Link
                                href="/admin/pages"
                                aria-label="Back to pages"
                            >
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <Input
                            value={title}
                            onChange={(event) => {
                                setTitle(event.target.value);
                                markDirty();
                            }}
                            placeholder="Page title"
                            aria-label="Page title"
                            className="h-9 max-w-sm border-transparent bg-transparent px-1 text-lg font-semibold shadow-none focus-visible:border-input"
                        />
                        {!isNew ? <StatusBadge status={status} /> : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={cn(
                                'mr-1 flex items-center gap-1.5 text-xs',
                                saveState === 'error'
                                    ? 'text-status-error'
                                    : 'text-muted-foreground',
                            )}
                            aria-live="polite"
                        >
                            {saveState === 'saving' ? (
                                <Spinner className="size-3" />
                            ) : null}
                            {saveState === 'saved' ? (
                                <Check className="size-3" />
                            ) : null}
                            {saveLabel}
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSeoOpen(true)}
                        >
                            SEO
                        </Button>

                        {!isNew ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRevisionsOpen(true)}
                            >
                                <History className="size-4" />
                                Revisions
                            </Button>
                        ) : null}

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={previewDisabled}
                            asChild={!previewDisabled}
                        >
                            {previewDisabled ? (
                                <span>
                                    <Eye className="size-4" />
                                    Preview
                                </span>
                            ) : (
                                <a
                                    href={page?.urls.preview as string}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Eye className="size-4" />
                                    Preview
                                </a>
                            )}
                        </Button>

                        <Button
                            size="sm"
                            onClick={save}
                            disabled={isNew === false && saveState === 'saving'}
                        >
                            {isNew ? 'Create page' : 'Save'}
                        </Button>

                        {can.publish && !isNew ? (
                            status === 'published' ? (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={unpublish}
                                >
                                    Unpublish
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setScheduleOpen(true)}
                                    >
                                        <Clock className="size-4" />
                                        Schedule
                                    </Button>
                                    <Button size="sm" onClick={publish}>
                                        <Rocket className="size-4" />
                                        Publish
                                    </Button>
                                </>
                            )
                        ) : null}
                    </div>
                </div>

                {Object.keys(fieldErrors).length > 0 ? (
                    <div className="rounded-md border border-status-error/30 bg-status-error-soft px-3 py-2 text-xs text-status-error">
                        {fieldErrors[Object.keys(fieldErrors)[0]]}
                    </div>
                ) : null}

                <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
                    {/* Outline */}
                    <aside className="space-y-2" aria-label="Page outline">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-semibold tracking-wide uppercase">
                                Sections
                            </h2>
                            <span className="text-[11px] text-muted-foreground">
                                {blocks.length}
                            </span>
                        </div>

                        <ul className="space-y-1">
                            {blocks.map((block, index) => {
                                const def = sectionDef(sections, block.section);

                                return (
                                    <li key={block.id}>
                                        <div
                                            className={cn(
                                                'group flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm transition-colors',
                                                selectedId === block.id
                                                    ? 'border-primary/40 bg-primary/5'
                                                    : 'border-transparent hover:bg-muted',
                                            )}
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedId(block.id)
                                                }
                                                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                            >
                                                <GripVertical className="size-3.5 shrink-0 text-muted-foreground" />
                                                <span
                                                    className={cn(
                                                        'truncate',
                                                        !block.enabled &&
                                                            'text-muted-foreground line-through',
                                                    )}
                                                >
                                                    {def?.label ??
                                                        block.section}
                                                </span>
                                            </button>
                                            <div className="flex shrink-0 items-center">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-6"
                                                    aria-label="Move up"
                                                    onClick={() =>
                                                        moveBlock(index, -1)
                                                    }
                                                >
                                                    <ChevronUp className="size-3" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-6"
                                                    aria-label="Move down"
                                                    onClick={() =>
                                                        moveBlock(index, 1)
                                                    }
                                                >
                                                    <ChevronDown className="size-3" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-6"
                                                    aria-label={
                                                        block.enabled
                                                            ? 'Hide section'
                                                            : 'Show section'
                                                    }
                                                    onClick={() =>
                                                        toggleBlock(block.id)
                                                    }
                                                >
                                                    <Eye
                                                        className={cn(
                                                            'size-3',
                                                            !block.enabled &&
                                                                'opacity-40',
                                                        )}
                                                    />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-6"
                                                    aria-label="Remove section"
                                                    onClick={() =>
                                                        removeBlock(block.id)
                                                    }
                                                >
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="space-y-1 border-t border-border/60 pt-2">
                            <p className="px-1 text-[11px] text-muted-foreground">
                                Add a section
                            </p>
                            {sections.map((section) => (
                                <Button
                                    key={section.key}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start text-xs"
                                    onClick={() => addBlock(section)}
                                >
                                    <Plus className="size-3.5" />
                                    {section.label}
                                </Button>
                            ))}
                        </div>
                    </aside>

                    {/* Canvas */}
                    <div className="min-w-0" aria-label="Page canvas">
                        {blocks.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border px-6 py-20 text-center">
                                <p className="text-sm font-medium">
                                    This page is empty
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Add a section from the outline to start
                                    building.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-lg border border-border bg-card">
                                {blocks.map((block) => (
                                    <div
                                        key={block.id}
                                        id={`block-${block.id}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setSelectedId(block.id)}
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === 'Enter' ||
                                                event.key === ' '
                                            ) {
                                                setSelectedId(block.id);
                                            }
                                        }}
                                        className={cn(
                                            'relative cursor-pointer border-b border-border/50 last:border-0',
                                            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset',
                                            selectedId === block.id &&
                                                'ring-2 ring-primary/40 ring-inset',
                                            pendingSection === block.id &&
                                                'ring-2 ring-status-error ring-inset',
                                            !block.enabled && 'opacity-40',
                                        )}
                                    >
                                        <SectionRenderer block={block} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Inspector */}
                    <aside className="space-y-3" aria-label="Section settings">
                        {selected && selectedDef ? (
                            <Card className="gap-3 py-4">
                                <CardHeader className="px-4">
                                    <CardTitle className="text-sm">
                                        {selectedDef.label}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedDef.description}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-4 px-4">
                                    {selectedDef.fields.map((field) => {
                                        const errorKey = Object.keys(
                                            fieldErrors,
                                        ).find(
                                            (key) =>
                                                key.endsWith(
                                                    `content.${field.key}`,
                                                ) &&
                                                blocks.findIndex(
                                                    (block) =>
                                                        block.id ===
                                                        selected.id,
                                                ) ===
                                                    blockIndexFromErrorKey(key),
                                        );

                                        return (
                                            <FieldControl
                                                key={field.key}
                                                field={field}
                                                value={
                                                    selected.content[field.key]
                                                }
                                                error={
                                                    errorKey
                                                        ? fieldErrors[errorKey]
                                                        : undefined
                                                }
                                                idPrefix={`field-${selected.id}`}
                                                onChange={(value) =>
                                                    updateSelectedContent(
                                                        field.key,
                                                        value,
                                                    )
                                                }
                                            />
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-xs text-muted-foreground">
                                Select a section to edit its content.
                            </div>
                        )}
                    </aside>
                </div>
            </div>

            <SeoDialog
                open={seoOpen}
                onOpenChange={setSeoOpen}
                title={seoTitle}
                description={seoDescription}
                slug={slug}
                excerpt={excerpt}
                robots={robots}
                onTitle={setSeoTitle}
                onDescription={setSeoDescription}
                onSlug={(value) => {
                    setSlug(value);
                    markDirty();
                }}
                onExcerpt={setExcerpt}
                onRobots={setRobots}
            />

            <Sheet open={revisionsOpen} onOpenChange={setRevisionsOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Revisions</SheetTitle>
                        <SheetDescription>
                            Restoring keeps a snapshot of the current state.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-2 overflow-y-auto px-4 pb-6">
                        {revisions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No revisions yet.
                            </p>
                        ) : (
                            revisions.map((revision) => (
                                <div
                                    key={revision.id}
                                    className="rounded-md border border-border px-3 py-2"
                                >
                                    <p className="text-sm font-medium">
                                        {revision.label ?? revision.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {revision.user ?? 'System'} ·{' '}
                                        {revision.created_at
                                            ? new Date(
                                                  revision.created_at,
                                              ).toLocaleString()
                                            : ''}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 h-7"
                                        onClick={() =>
                                            router.post(
                                                revision.restore_url,
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () =>
                                                        setRevisionsOpen(false),
                                                },
                                            )
                                        }
                                    >
                                        Restore
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule publication</DialogTitle>
                        <DialogDescription>
                            The page becomes public at the chosen time. It stays
                            a draft until then.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="schedule-at">Publish at</Label>
                        <Input
                            id="schedule-at"
                            type="datetime-local"
                            value={scheduleAt}
                            onChange={(event) =>
                                setScheduleAt(event.target.value)
                            }
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setScheduleOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={schedule} disabled={scheduleAt === ''}>
                            Schedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function SeoDialog({
    open,
    onOpenChange,
    title,
    description,
    slug,
    excerpt,
    robots,
    onTitle,
    onDescription,
    onSlug,
    onExcerpt,
    onRobots,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    slug: string;
    excerpt: string;
    robots: string;
    onTitle: (value: string) => void;
    onDescription: (value: string) => void;
    onSlug: (value: string) => void;
    onExcerpt: (value: string) => void;
    onRobots: (value: string) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Search engine preview</DialogTitle>
                    <DialogDescription>
                        Titles read best under 60 characters, descriptions under
                        160.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                        <p className="truncate text-xs text-[oklch(0.45_0.13_240)]">
                            lattice.test/{slug || 'your-page'}
                        </p>
                        <p className="truncate text-sm font-medium text-primary">
                            {title || 'Page title'}
                        </p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                            {description ||
                                excerpt ||
                                'Add a description to control the snippet.'}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="seo-title" className="text-xs">
                            SEO title
                        </Label>
                        <Input
                            id="seo-title"
                            value={title}
                            maxLength={70}
                            onChange={(event) => onTitle(event.target.value)}
                        />
                        <p
                            className={cn(
                                'text-[11px]',
                                title.length > 60
                                    ? 'text-status-scheduled'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {title.length}/60
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="seo-description" className="text-xs">
                            Meta description
                        </Label>
                        <textarea
                            id="seo-description"
                            value={description}
                            maxLength={170}
                            rows={3}
                            onChange={(event) =>
                                onDescription(event.target.value)
                            }
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                        />
                        <p
                            className={cn(
                                'text-[11px]',
                                description.length > 160
                                    ? 'text-status-scheduled'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {description.length}/160
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="page-slug" className="text-xs">
                            URL slug
                        </Label>
                        <Input
                            id="page-slug"
                            value={slug}
                            onChange={(event) => onSlug(event.target.value)}
                            className="font-mono text-xs"
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Changing this keeps the old URL working with a
                            permanent redirect.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="page-excerpt" className="text-xs">
                            Excerpt
                        </Label>
                        <textarea
                            id="page-excerpt"
                            value={excerpt}
                            rows={2}
                            maxLength={400}
                            onChange={(event) => onExcerpt(event.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Robots</Label>
                        <Select
                            value={robots}
                            onValueChange={(value) => onRobots(value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="index,follow">
                                    Index, follow
                                </SelectItem>
                                <SelectItem value="noindex,follow">
                                    No index, follow
                                </SelectItem>
                                <SelectItem value="noindex,nofollow">
                                    No index, no follow
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
