import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ChevronDown,
    ChevronRight,
    Copy,
    GripVertical,
    Monitor,
    Plus,
    Redo2,
    Search,
    Shuffle,
    LayoutGrid,
    Square,
    SlidersHorizontal,
    Smartphone,
    Tablet,
    Trash2,
    Undo2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
    discard,
    preview,
    publish,
    saveDraft,
} from '@/actions/App/Http/Controllers/Admin/LandingController';
import { BlockDesign } from '@/components/landing/block-design';
import { BlockFields } from '@/components/landing/block-fields';
import { BlockMockup } from '@/components/landing/block-mockup';
import {
    blockTypes,
    cloneBlock,
    createBlock,
    MAX_BLOCKS,
    resolveStyle,
    setBlockField,
    variantCount,
    VARIANT_NAMES,
} from '@/components/landing/block-types';
import type { BlockType, LandingBlock } from '@/components/landing/block-types';
import { LandingEditContext } from '@/components/landing/landing-edit';
import { RenderBlock } from '@/components/landing/render-block';
import type { LandingTheme } from '@/components/landing/theme';
import { themeStyle } from '@/components/landing/theme';
import { ThemePanel } from '@/components/landing/theme-panel';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTitle,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { useAppearance } from '@/hooks/use-appearance';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import { index as indexAdminLanding } from '@/routes/admin/landing';

// What the editor changes, and therefore what undo and redo go back through.
type Snapshot = { blocks: LandingBlock[]; theme: LandingTheme };

type Preset = {
    key: string;
    label: string;
    description: string;
    blocks: LandingBlock[];
    theme?: LandingTheme;
};

type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<Device, string> = {
    desktop: '100%',
    tablet: '768px',
    mobile: '390px',
};

// Keeps undo history. Changes that share a key within a run (typing in one field) become one step.
function useHistory(initial: Snapshot) {
    const [state, setState] = useState({
        past: [] as Snapshot[],
        present: initial,
        future: [] as Snapshot[],
        key: null as string | null,
    });

    const set = useCallback((next: Snapshot, key?: string) => {
        setState((current) => {
            const coalesce = key !== undefined && key === current.key;

            return {
                past: coalesce
                    ? current.past
                    : [...current.past, current.present].slice(-100),
                present: next,
                future: [],
                key: key ?? null,
            };
        });
    }, []);

    const reset = useCallback((value: Snapshot) => {
        setState({ past: [], present: value, future: [], key: null });
    }, []);

    const undo = useCallback(() => {
        setState((current) => {
            const previous = current.past[current.past.length - 1];

            if (!previous) {
                return current;
            }

            return {
                past: current.past.slice(0, -1),
                present: previous,
                future: [current.present, ...current.future],
                key: null,
            };
        });
    }, []);

    const redo = useCallback(() => {
        setState((current) => {
            const [next, ...rest] = current.future;

            if (!next) {
                return current;
            }

            return {
                past: [...current.past, current.present],
                present: next,
                future: rest,
                key: null,
            };
        });
    }, []);

    return {
        present: state.present,
        set,
        reset,
        undo,
        redo,
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
    };
}

// The landing page editor. Changes are saved as a draft. Publishing copies the saved draft to the public page.
export default function LandingEditor({
    draft,
    theme: savedTheme,
    presets,
    blockTypes: typeNames,
}: {
    draft: LandingBlock[];
    theme: LandingTheme;
    presets: Preset[];
    blockTypes: BlockType[];
}) {
    const t = useTrans();
    const draftKey = JSON.stringify({ blocks: draft, theme: savedTheme });

    const history = useHistory({ blocks: draft, theme: savedTheme });
    const { blocks, theme } = history.present;

    // The last state the server has. Compared with the editor to know whether there are unsaved changes.
    const [saved, setSaved] = useState(draftKey);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [discarding, setDiscarding] = useState(false);
    const [applying, setApplying] = useState<Preset | null>(null);
    const [processing, setProcessing] = useState(false);
    const [device, setDevice] = useState<Device>('desktop');
    const [tab, setTab] = useState('block');
    const [leftTab, setLeftTab] = useState('blocks');
    const [query, setQuery] = useState('');
    // How the block cards are laid out: two per row, or one per row with larger previews.
    const [view, setView] = useState<'grid' | 'list'>('grid');

    // A new draft from the server (after a save or publish) replaces the editor's copy.
    // Done during render, as React recommends for resetting state from props.
    const [source, setSource] = useState(draftKey);

    if (draftKey !== source) {
        setSource(draftKey);
        history.reset({ blocks: draft, theme: savedTheme });
        setSaved(draftKey);
    }

    const dirty = JSON.stringify({ blocks, theme }) !== saved;
    const selected = blocks.find((block) => block.id === selectedId) ?? null;
    const paletteTypes = useMemo(
        () => blockTypes.filter((item) => typeNames.includes(item.type)),
        [typeNames],
    );

    const filteredTypes = paletteTypes.filter((item) =>
        t(item.label).toLowerCase().includes(query.trim().toLowerCase()),
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const showError = useCallback(
        (message: string) => toast.add({ type: 'error', title: message }),
        [],
    );

    const commit = useCallback(
        (next: Snapshot, key?: string) => history.set(next, key),
        [history],
    );

    // Undo and redo with Ctrl or Cmd. Inside a text field the browser's own undo is used instead.
    useEffect(() => {
        const handle = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;

            if (
                target?.isContentEditable ||
                target?.tagName === 'INPUT' ||
                target?.tagName === 'TEXTAREA' ||
                target?.tagName === 'SELECT'
            ) {
                return;
            }

            if (!(event.ctrlKey || event.metaKey)) {
                return;
            }

            const key = event.key.toLowerCase();

            if (key === 'z' && !event.shiftKey) {
                event.preventDefault();
                history.undo();
            } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
                event.preventDefault();
                history.redo();
            }
        };

        window.addEventListener('keydown', handle);

        return () => window.removeEventListener('keydown', handle);
    }, [history]);

    // Validation errors come back keyed by block, such as blocks.2.data.url. Select that block so the
    // admin sees which one to fix.
    const handleSaveErrors = useCallback(
        (errors: Record<string, string>, current: LandingBlock[]) => {
            const [firstKey, message] = Object.entries(errors)[0] ?? [];
            const index = Number(firstKey?.match(/^blocks\.(\d+)/)?.[1]);

            if (!Number.isNaN(index) && current[index]) {
                setSelectedId(current[index].id);
                setTab('block');
            }

            showError(message ?? t('The draft could not be saved.'));
        },
        [showError, t],
    );

    const save = () => {
        const submitted = { blocks, theme };

        router.put(saveDraft.url(), submitted, {
            preserveScroll: true,
            onSuccess: () => setSaved(JSON.stringify(submitted)),
            onError: (errors) => handleSaveErrors(errors, submitted.blocks),
        });
    };

    const runPublish = () => {
        setProcessing(true);
        router.post(
            publish.url(),
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const runDiscard = () => {
        setProcessing(true);
        router.post(
            discard.url(),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setDiscarding(false);
                },
            },
        );
    };

    const update = (block: LandingBlock) =>
        commit(
            {
                ...history.present,
                blocks: blocks.map((item) =>
                    item.id === block.id ? block : item,
                ),
            },
            `field:${block.id}`,
        );

    // Inline edits from the canvas. Each field's run of typing is one undo step.
    // Moves a block to the next layout of its type, wrapping back to the first.
    const shuffleBlock = (id: string) => {
        const block = blocks.find((item) => item.id === id);

        if (!block || variantCount(block.type) < 2) {
            return;
        }

        const next =
            (resolveStyle(block).variant + 1) % variantCount(block.type);

        update({
            ...block,
            style: { ...block.style, variant: next },
        } as LandingBlock);
    };

    const setText = useCallback(
        (blockId: string, path: string, value: string) =>
            commit(
                {
                    ...history.present,
                    blocks: history.present.blocks.map((block) =>
                        block.id === blockId
                            ? setBlockField(block, path, value)
                            : block,
                    ),
                },
                `text:${blockId}:${path}`,
            ),
        [commit, history.present],
    );

    const addBlock = (type: BlockType, index?: number, variant = 0) => {
        if (blocks.length >= MAX_BLOCKS) {
            showError(
                t('A page can have up to :count blocks.', {
                    count: MAX_BLOCKS,
                }),
            );

            return;
        }

        const block = createBlock(type, variant);
        const at = index ?? blocks.length;

        commit({
            ...history.present,
            blocks: [...blocks.slice(0, at), block, ...blocks.slice(at)],
        });
        setSelectedId(block.id);
        setTab('block');
    };

    const duplicateBlock = (id: string) => {
        if (blocks.length >= MAX_BLOCKS) {
            showError(
                t('A page can have up to :count blocks.', {
                    count: MAX_BLOCKS,
                }),
            );

            return;
        }

        const index = blocks.findIndex((block) => block.id === id);
        const copy = cloneBlock(blocks[index]!);

        commit({
            ...history.present,
            blocks: [
                ...blocks.slice(0, index + 1),
                copy,
                ...blocks.slice(index + 1),
            ],
        });
        setSelectedId(copy.id);
    };

    const removeBlock = (id: string) => {
        commit({
            ...history.present,
            blocks: blocks.filter((block) => block.id !== id),
        });
        setSelectedId((current) => (current === id ? null : current));
    };

    const moveBlock = (id: string, delta: number) => {
        const from = blocks.findIndex((block) => block.id === id);
        const to = from + delta;

        if (from < 0 || to < 0 || to >= blocks.length) {
            return;
        }

        commit({ ...history.present, blocks: arrayMove(blocks, from, to) });
    };

    const setTheme = (next: LandingTheme) =>
        commit({ ...history.present, theme: next }, 'theme');

    const applyPreset = (preset: Preset) => {
        commit({
            blocks: preset.blocks.map((block) => cloneBlock(block)),
            theme: preset.theme ?? history.present.theme,
        });
        setSelectedId(null);
        setApplying(null);
    };

    // Dragging a palette item onto a block inserts it before that block. Dropping it on the empty
    // canvas adds it at the end. Dragging a block onto another block reorders them.
    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            return;
        }

        const activeId = String(active.id);
        const overId = String(over.id);

        if (activeId.startsWith('palette:')) {
            const type = activeId.slice('palette:'.length) as BlockType;
            const overIndex = blocks.findIndex((block) => block.id === overId);

            addBlock(type, overIndex === -1 ? undefined : overIndex);

            return;
        }

        if (activeId !== overId) {
            const from = blocks.findIndex((block) => block.id === activeId);
            const to = blocks.findIndex((block) => block.id === overId);

            if (from >= 0 && to >= 0) {
                commit({
                    ...history.present,
                    blocks: arrayMove(blocks, from, to),
                });
            }
        }
    };

    // Sections the editor shows folded to their header. Folding only changes the editor, not the page.
    const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
    const toggleCollapsed = (id: string) =>
        setCollapsed((previous) => {
            const next = new Set(previous);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    const setAllCollapsed = (value: boolean) =>
        setCollapsed(
            value ? new Set(blocks.map((block) => block.id)) : new Set(),
        );

    const selectedLabel = selected
        ? (paletteTypes.find((item) => item.type === selected.type)?.label ??
          selected.type)
        : '';

    return (
        <>
            <Head title={t('Visual editor')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Visual editor')}
                    description={t(
                        'Drag blocks onto the page, click any text to edit it, then style each block. Save a draft, then publish it when it is ready.',
                    )}
                />

                <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={save} disabled={!dirty}>
                        {t('Save draft')}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={runPublish}
                        disabled={dirty || processing}
                    >
                        {t('Publish')}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setDiscarding(true)}
                        disabled={processing}
                    >
                        {t('Replace draft with published')}
                    </Button>
                    <Button
                        variant="ghost"
                        render={
                            <a
                                href={preview.url()}
                                target="_blank"
                                rel="noreferrer"
                            />
                        }
                        nativeButton={false}
                    >
                        {t('Open preview')}
                    </Button>
                    <div className="ml-auto flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('Undo')}
                            title={t('Undo (Ctrl+Z)')}
                            disabled={!history.canUndo}
                            onClick={history.undo}
                        >
                            <Undo2 />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('Redo')}
                            title={t('Redo (Ctrl+Shift+Z)')}
                            disabled={!history.canRedo}
                            onClick={history.redo}
                        >
                            <Redo2 />
                        </Button>
                        <DeviceButton
                            current={device}
                            value="desktop"
                            label={t('Desktop preview')}
                            onSelect={setDevice}
                            icon={<Monitor />}
                        />
                        <DeviceButton
                            current={device}
                            value="tablet"
                            label={t('Tablet preview')}
                            onSelect={setDevice}
                            icon={<Tablet />}
                        />
                        <DeviceButton
                            current={device}
                            value="mobile"
                            label={t('Mobile preview')}
                            onSelect={setDevice}
                            icon={<Smartphone />}
                        />
                    </div>
                    {dirty && (
                        <span className="text-sm text-muted-foreground">
                            {t(
                                'Unsaved changes. Save the draft before publishing or previewing.',
                            )}
                        </span>
                    )}
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={onDragEnd}
                >
                    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_340px]">
                        <aside className="flex flex-col gap-3 rounded-xl border bg-card p-3">
                            <Tabs value={leftTab} onValueChange={setLeftTab}>
                                <TabsList className="w-full">
                                    <TabsTrigger
                                        value="blocks"
                                        className="flex-1"
                                    >
                                        {t('Blocks')}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="pages"
                                        className="flex-1"
                                    >
                                        {t('Pages')}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent
                                    value="blocks"
                                    className="flex flex-col gap-2 pt-3"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search
                                                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                                                aria-hidden="true"
                                            />
                                            <Input
                                                type="search"
                                                value={query}
                                                onChange={(event) =>
                                                    setQuery(event.target.value)
                                                }
                                                placeholder={t('Search blocks')}
                                                aria-label={t('Search blocks')}
                                                className="pl-8"
                                            />
                                        </div>
                                        <Popover>
                                            <PopoverTrigger
                                                render={
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        aria-label={t(
                                                            'Block settings',
                                                        )}
                                                        title={t(
                                                            'Block settings',
                                                        )}
                                                    >
                                                        <SlidersHorizontal aria-hidden="true" />
                                                    </Button>
                                                }
                                            />
                                            <PopoverContent
                                                align="end"
                                                className="w-56 gap-3 p-3"
                                            >
                                                <PopoverTitle className="text-sm font-medium">
                                                    {t('Block settings')}
                                                </PopoverTitle>
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {t('Image Preview')}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            type="button"
                                                            variant={
                                                                view === 'grid'
                                                                    ? 'secondary'
                                                                    : 'ghost'
                                                            }
                                                            size="icon"
                                                            aria-pressed={
                                                                view === 'grid'
                                                            }
                                                            aria-label={t(
                                                                'Two columns',
                                                            )}
                                                            title={t(
                                                                'Two columns',
                                                            )}
                                                            onClick={() =>
                                                                setView('grid')
                                                            }
                                                        >
                                                            <LayoutGrid aria-hidden="true" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={
                                                                view === 'list'
                                                                    ? 'secondary'
                                                                    : 'ghost'
                                                            }
                                                            size="icon"
                                                            aria-pressed={
                                                                view === 'list'
                                                            }
                                                            aria-label={t(
                                                                'One column',
                                                            )}
                                                            title={t(
                                                                'One column',
                                                            )}
                                                            onClick={() =>
                                                                setView('list')
                                                            }
                                                        >
                                                            <Square aria-hidden="true" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {filteredTypes.map((item) => (
                                            <PaletteItem
                                                key={item.type}
                                                type={item.type}
                                                label={t(item.label)}
                                                icon={item.icon}
                                                variants={
                                                    VARIANT_NAMES[item.type]
                                                }
                                                view={view}
                                                onAdd={(variant) =>
                                                    addBlock(
                                                        item.type,
                                                        undefined,
                                                        variant,
                                                    )
                                                }
                                            />
                                        ))}
                                        {filteredTypes.length === 0 && (
                                            <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                                                {t(
                                                    'No blocks match your search.',
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent
                                    value="pages"
                                    className="flex flex-col gap-2 pt-3"
                                >
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'Replaces the draft with a complete page. Save or undo afterwards.',
                                        )}
                                    </p>
                                    {presets.map((preset) => (
                                        <button
                                            key={preset.key}
                                            type="button"
                                            onClick={() => setApplying(preset)}
                                            className="flex flex-col gap-1 rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/60"
                                        >
                                            <span className="text-sm font-medium">
                                                {preset.label}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {preset.description}
                                            </span>
                                        </button>
                                    ))}
                                </TabsContent>
                            </Tabs>
                        </aside>

                        <Canvas
                            blocks={blocks}
                            theme={theme}
                            device={device}
                            collapsed={collapsed}
                            onToggleCollapsed={toggleCollapsed}
                            onCollapseAll={() => setAllCollapsed(true)}
                            onExpandAll={() => setAllCollapsed(false)}
                            selectedId={selectedId}
                            onSelect={(id) => {
                                setSelectedId(id);
                                setTab('block');
                            }}
                            onMove={moveBlock}
                            onRemove={removeBlock}
                            onDuplicate={duplicateBlock}
                            onShuffle={shuffleBlock}
                            onText={setText}
                        />

                        <aside className="flex flex-col gap-4 rounded-lg border p-4">
                            <Tabs value={tab} onValueChange={setTab}>
                                <TabsList>
                                    <TabsTrigger value="block">
                                        {t('Block')}
                                    </TabsTrigger>
                                    <TabsTrigger value="page">
                                        {t('Page design')}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="block" className="pt-4">
                                    {selected ? (
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between gap-2">
                                                <h2 className="font-medium">
                                                    {t(selectedLabel)}
                                                </h2>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            duplicateBlock(
                                                                selected.id,
                                                            )
                                                        }
                                                    >
                                                        <Copy />
                                                        {t('Duplicate')}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            removeBlock(
                                                                selected.id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 />
                                                        {t('Remove block')}
                                                    </Button>
                                                </div>
                                            </div>
                                            <BlockFields
                                                block={selected}
                                                onChange={update}
                                                onError={showError}
                                            />
                                            <Separator />
                                            <h3 className="text-sm font-medium">
                                                {t('Design')}
                                            </h3>
                                            <BlockDesign
                                                block={selected}
                                                onChange={update}
                                                onError={showError}
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                'Select a block on the page to edit its text, images, and design.',
                                            )}
                                        </p>
                                    )}
                                </TabsContent>

                                <TabsContent value="page" className="pt-4">
                                    <p className="mb-4 text-sm text-muted-foreground">
                                        {t(
                                            'The page theme sets colours, corners, and fonts for the whole landing page.',
                                        )}
                                    </p>
                                    <ThemePanel
                                        theme={theme}
                                        onChange={setTheme}
                                    />
                                </TabsContent>
                            </Tabs>
                        </aside>
                    </div>
                </DndContext>
            </div>

            <AlertDialog
                open={applying !== null}
                onOpenChange={(open) => !open && setApplying(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('Use the :name preset?', {
                                name: applying?.label ?? '',
                            })}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'The blocks in the draft will be replaced. The public page is not changed until you publish.',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => applying && applyPreset(applying)}
                        >
                            {t('Use preset')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={discarding} onOpenChange={setDiscarding}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('Replace the draft with the published page?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'Unsaved and saved draft changes will be lost. The public page is not changed.',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={runDiscard}
                        >
                            {t('Replace')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function DeviceButton({
    current,
    value,
    label,
    icon,
    onSelect,
}: {
    current: Device;
    value: Device;
    label: string;
    icon: ReactNode;
    onSelect: (device: Device) => void;
}) {
    return (
        <Button
            variant={current === value ? 'secondary' : 'ghost'}
            size="icon"
            aria-label={label}
            aria-pressed={current === value}
            title={label}
            onClick={() => onSelect(value)}
        >
            {icon}
        </Button>
    );
}

function PaletteItem({
    type,
    label,
    icon: Icon,
    variants,
    view,
    onAdd,
}: {
    type: BlockType;
    label: string;
    icon: (typeof blockTypes)[number]['icon'];
    variants: string[];
    view: 'grid' | 'list';
    onAdd: (variant: number) => void;
}) {
    const t = useTrans();
    const [open, setOpen] = useState(false);
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette:${type}`,
    });
    // The number of other layouts, shown as "+N" on the row.
    const more = variants.length - 1;

    return (
        <div className="flex flex-col gap-2">
            <button
                ref={setNodeRef}
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                {...attributes}
                {...listeners}
                className={cn(
                    'flex w-full items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60',
                    isDragging && 'opacity-50',
                )}
            >
                <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="truncate font-medium">{label}</span>
                </span>
                {more > 0 && (
                    <span className="rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
                        +{more}
                    </span>
                )}
                {open ? (
                    <ChevronDown
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                    />
                ) : (
                    <ChevronRight
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                    />
                )}
            </button>
            {open && (
                <ul
                    className={cn(
                        'grid gap-2 border-l-2 pl-2',
                        view === 'grid' ? 'grid-cols-2' : 'grid-cols-1',
                    )}
                >
                    {variants.map((name, index) => (
                        <li key={name}>
                            <button
                                type="button"
                                onClick={() => onAdd(index)}
                                className="flex w-full flex-col gap-1 rounded-md p-1 text-left hover:bg-muted"
                            >
                                <BlockMockup type={type} variant={index} />
                                <span className="truncate px-0.5 text-xs text-muted-foreground">
                                    {t(name)}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function Canvas({
    blocks,
    theme,
    device,
    collapsed,
    onToggleCollapsed,
    onCollapseAll,
    onExpandAll,
    selectedId,
    onSelect,
    onMove,
    onRemove,
    onDuplicate,
    onShuffle,
    onText,
}: {
    blocks: LandingBlock[];
    theme: LandingTheme;
    device: Device;
    collapsed: Set<string>;
    onToggleCollapsed: (id: string) => void;
    onCollapseAll: () => void;
    onExpandAll: () => void;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onMove: (id: string, delta: number) => void;
    onRemove: (id: string) => void;
    onDuplicate: (id: string) => void;
    onShuffle: (id: string) => void;
    onText: (blockId: string, path: string, value: string) => void;
}) {
    const t = useTrans();
    const { resolvedAppearance } = useAppearance();
    const { setNodeRef, isOver } = useDroppable({ id: 'canvas' });

    return (
        <div className="flex min-w-0 flex-col items-center gap-3">
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{t('Landing page')}</span>
                    <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                        {device === 'desktop'
                            ? t('Desktop')
                            : device === 'tablet'
                              ? t('Tablet, 768 px')
                              : t('Mobile, 390 px')}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onCollapseAll}
                        disabled={blocks.length === 0}
                    >
                        {t('Collapse all')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onExpandAll}
                        disabled={collapsed.size === 0}
                    >
                        {t('Expand all')}
                    </Button>
                </div>
            </div>
            <div className="flex w-full justify-center rounded-xl border bg-muted/40 p-4">
                <div
                    className="w-full transition-[max-width] duration-300"
                    style={{ maxWidth: DEVICE_WIDTHS[device] }}
                >
                    <div
                        ref={setNodeRef}
                        style={themeStyle(theme, resolvedAppearance === 'dark')}
                        className={cn(
                            'flex min-h-96 flex-col gap-3 overflow-hidden rounded-lg border bg-background p-3 text-foreground shadow-sm',
                            isOver && 'ring-2 ring-ring',
                        )}
                    >
                        <SortableContext
                            items={blocks.map((block) => block.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {blocks.length === 0 && (
                                <div className="m-auto flex flex-col items-center gap-3 py-16 text-center">
                                    <span className="flex size-10 items-center justify-center rounded-full border bg-muted">
                                        <Plus
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <p className="text-sm text-muted-foreground">
                                        {t(
                                            'Drag a block here, or click one in the list.',
                                        )}
                                    </p>
                                </div>
                            )}
                            {blocks.map((block, index) => (
                                <SortableBlock
                                    key={block.id}
                                    block={block}
                                    index={index}
                                    total={blocks.length}
                                    selected={block.id === selectedId}
                                    collapsed={collapsed.has(block.id)}
                                    onToggle={() => onToggleCollapsed(block.id)}
                                    onSelect={() => onSelect(block.id)}
                                    onMove={(delta) => onMove(block.id, delta)}
                                    onRemove={() => onRemove(block.id)}
                                    onDuplicate={() => onDuplicate(block.id)}
                                    onShuffle={() => onShuffle(block.id)}
                                    onText={(path, value) =>
                                        onText(block.id, path, value)
                                    }
                                />
                            ))}
                        </SortableContext>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SortableBlock({
    block,
    index,
    total,
    selected,
    collapsed,
    onToggle,
    onSelect,
    onMove,
    onRemove,
    onDuplicate,
    onShuffle,
    onText,
}: {
    block: LandingBlock;
    index: number;
    total: number;
    selected: boolean;
    collapsed: boolean;
    onToggle: () => void;
    onSelect: () => void;
    onMove: (delta: number) => void;
    onRemove: () => void;
    onDuplicate: () => void;
    onShuffle: () => void;
    onText: (path: string, value: string) => void;
}) {
    const t = useTrans();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const binding = useMemo(
        () => ({ blockId: block.id, setText: onText }),
        [block.id, onText],
    );

    const layoutName =
        VARIANT_NAMES[block.type][resolveStyle(block).variant] ?? '';
    const canShuffle = variantCount(block.type) > 1;

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            onClick={onSelect}
            className={cn(
                'overflow-hidden rounded-lg border bg-background',
                selected && 'ring-2 ring-ring',
                isDragging && 'opacity-70',
            )}
        >
            <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-2 py-1">
                <div className="flex min-w-0 items-center gap-1">
                    <button
                        type="button"
                        aria-expanded={!collapsed}
                        aria-label={
                            collapsed
                                ? t('Expand section')
                                : t('Collapse section')
                        }
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggle();
                        }}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        {collapsed ? (
                            <ChevronRight
                                className="size-4"
                                aria-hidden="true"
                            />
                        ) : (
                            <ChevronDown
                                className="size-4"
                                aria-hidden="true"
                            />
                        )}
                    </button>
                    <button
                        type="button"
                        className="flex cursor-grab items-center gap-1 text-xs text-muted-foreground"
                        aria-label={t('Drag to reorder')}
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="size-4" aria-hidden="true" />
                        <span className="tabular-nums">{index + 1}</span>
                    </button>
                    <span className="ml-1 hidden truncate rounded-full border bg-background px-2 py-0.5 text-xs sm:inline">
                        {t(
                            blockTypes.find((item) => item.type === block.type)
                                ?.label ?? block.type,
                        )}
                        {layoutName ? ` · ${t(layoutName)}` : ''}
                    </span>
                </div>
                <div className="flex items-center gap-0.5">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('Move up')}
                        disabled={index === 0}
                        onClick={(event) => {
                            event.stopPropagation();
                            onMove(-1);
                        }}
                    >
                        <ArrowUp />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('Move down')}
                        disabled={index === total - 1}
                        onClick={(event) => {
                            event.stopPropagation();
                            onMove(1);
                        }}
                    >
                        <ArrowDown />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('Shuffle layout')}
                        title={t('Shuffle layout')}
                        disabled={!canShuffle}
                        onClick={(event) => {
                            event.stopPropagation();
                            onShuffle();
                        }}
                    >
                        <Shuffle />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('Duplicate')}
                        onClick={(event) => {
                            event.stopPropagation();
                            onDuplicate();
                        }}
                    >
                        <Copy />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('Remove block')}
                        onClick={(event) => {
                            event.stopPropagation();
                            onRemove();
                        }}
                    >
                        <Trash2 />
                    </Button>
                </div>
            </div>
            {/* Links inside the preview do not open while editing. Text stays editable (see EditableText). */}
            <div
                className={cn(
                    'pointer-events-none overflow-hidden',
                    collapsed && 'hidden',
                )}
            >
                <LandingEditContext value={binding}>
                    <RenderBlock block={block} />
                </LandingEditContext>
            </div>
        </div>
    );
}

LandingEditor.layout = {
    breadcrumbs: [
        {
            title: 'Visual editor',
            href: indexAdminLanding(),
        },
    ],
};
