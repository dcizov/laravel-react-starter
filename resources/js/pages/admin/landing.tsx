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
    Copy,
    GripVertical,
    Monitor,
    Redo2,
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
import {
    blockTypes,
    cloneBlock,
    createBlock,
    MAX_BLOCKS,
    resolveStyle,
    setBlockField,
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

    const addBlock = (type: BlockType, index?: number) => {
        if (blocks.length >= MAX_BLOCKS) {
            showError(
                t('A page can have up to :count blocks.', {
                    count: MAX_BLOCKS,
                }),
            );

            return;
        }

        const block = createBlock(type);
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
                    <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)_340px]">
                        <aside className="flex flex-col gap-2">
                            <h2 className="text-sm font-medium">
                                {t('Blocks')}
                            </h2>
                            {paletteTypes.map((item) => (
                                <PaletteItem
                                    key={item.type}
                                    type={item.type}
                                    label={t(item.label)}
                                    icon={item.icon}
                                    onAdd={() => addBlock(item.type)}
                                />
                            ))}

                            <h2 className="mt-4 text-sm font-medium">
                                {t('Page presets')}
                            </h2>
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
                                    className="flex flex-col gap-0.5 rounded-md border bg-background px-3 py-2 text-left text-sm hover:bg-muted"
                                >
                                    <span className="font-medium">
                                        {preset.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {preset.description}
                                    </span>
                                </button>
                            ))}
                        </aside>

                        <Canvas
                            blocks={blocks}
                            theme={theme}
                            device={device}
                            selectedId={selectedId}
                            onSelect={(id) => {
                                setSelectedId(id);
                                setTab('block');
                            }}
                            onMove={moveBlock}
                            onRemove={removeBlock}
                            onDuplicate={duplicateBlock}
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
    onAdd,
}: {
    type: BlockType;
    label: string;
    icon: (typeof blockTypes)[number]['icon'];
    onAdd: () => void;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette:${type}`,
    });

    return (
        <button
            ref={setNodeRef}
            type="button"
            onClick={onAdd}
            {...attributes}
            {...listeners}
            className={cn(
                'flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-left text-sm hover:bg-muted',
                isDragging && 'opacity-50',
            )}
        >
            <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
            {label}
        </button>
    );
}

function Canvas({
    blocks,
    theme,
    device,
    selectedId,
    onSelect,
    onMove,
    onRemove,
    onDuplicate,
    onText,
}: {
    blocks: LandingBlock[];
    theme: LandingTheme;
    device: Device;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onMove: (id: string, delta: number) => void;
    onRemove: (id: string) => void;
    onDuplicate: (id: string) => void;
    onText: (blockId: string, path: string, value: string) => void;
}) {
    const t = useTrans();
    const { resolvedAppearance } = useAppearance();
    const { setNodeRef, isOver } = useDroppable({ id: 'canvas' });

    return (
        <div className="flex min-w-0 flex-col items-center gap-2">
            <div className="text-xs text-muted-foreground">
                {device === 'desktop'
                    ? t('Desktop')
                    : device === 'tablet'
                      ? t('Tablet, 768 px')
                      : t('Mobile, 390 px')}
            </div>
            <div
                className="w-full transition-[max-width] duration-300"
                style={{ maxWidth: DEVICE_WIDTHS[device] }}
            >
                <div
                    ref={setNodeRef}
                    style={themeStyle(theme, resolvedAppearance === 'dark')}
                    className={cn(
                        'flex min-h-96 flex-col gap-3 overflow-hidden rounded-lg border-2 border-dashed bg-background p-3 text-foreground',
                        isOver && 'border-ring',
                    )}
                >
                    <SortableContext
                        items={blocks.map((block) => block.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {blocks.length === 0 && (
                            <p className="m-auto text-sm text-muted-foreground">
                                {t(
                                    'Drag a block here, or click one in the list.',
                                )}
                            </p>
                        )}
                        {blocks.map((block, index) => (
                            <SortableBlock
                                key={block.id}
                                block={block}
                                index={index}
                                total={blocks.length}
                                selected={block.id === selectedId}
                                onSelect={() => onSelect(block.id)}
                                onMove={(delta) => onMove(block.id, delta)}
                                onRemove={() => onRemove(block.id)}
                                onDuplicate={() => onDuplicate(block.id)}
                                onText={(path, value) =>
                                    onText(block.id, path, value)
                                }
                            />
                        ))}
                    </SortableContext>
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
    onSelect,
    onMove,
    onRemove,
    onDuplicate,
    onText,
}: {
    block: LandingBlock;
    index: number;
    total: number;
    selected: boolean;
    onSelect: () => void;
    onMove: (delta: number) => void;
    onRemove: () => void;
    onDuplicate: () => void;
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

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            onClick={onSelect}
            className={cn(
                'rounded-lg border bg-background',
                selected && 'ring-2 ring-ring',
                isDragging && 'opacity-70',
            )}
        >
            <div className="flex items-center justify-between gap-2 border-b px-2 py-1">
                <button
                    type="button"
                    className="flex cursor-grab items-center gap-1 text-xs text-muted-foreground"
                    aria-label={t('Drag to reorder')}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="size-4" aria-hidden="true" />
                    {index + 1}
                    <span className="ml-1 hidden text-foreground sm:inline">
                        {VARIANT_NAMES[block.type][
                            resolveStyle(block).variant
                        ] ?? ''}
                    </span>
                </button>
                <div className="flex items-center gap-1">
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
            <div className="pointer-events-none overflow-hidden">
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
