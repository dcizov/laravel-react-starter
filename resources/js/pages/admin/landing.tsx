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
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
    discard,
    preview,
    publish,
    saveDraft,
} from '@/actions/App/Http/Controllers/Admin/LandingController';
import { BlockFields } from '@/components/landing/block-fields';
import {
    blockTypes,
    createBlock,
    MAX_BLOCKS,
} from '@/components/landing/block-types';
import type { BlockType, LandingBlock } from '@/components/landing/block-types';
import { RenderBlock } from '@/components/landing/render-block';
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
import { toast } from '@/components/ui/toast';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import { index as indexAdminLanding } from '@/routes/admin/landing';

// The landing page editor. Changes are saved as a draft. Publishing copies the saved draft to the public page.
export default function LandingEditor({
    draft,
    blockTypes: typeNames,
}: {
    draft: LandingBlock[];
    published: LandingBlock[];
    hasDraft: boolean;
    blockTypes: BlockType[];
}) {
    const t = useTrans();
    const draftKey = JSON.stringify(draft);

    const [blocks, setBlocks] = useState<LandingBlock[]>(draft);
    // The last state the server has. Compared with the editor to know whether there are unsaved changes.
    const [saved, setSaved] = useState(draftKey);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [discarding, setDiscarding] = useState(false);
    const [processing, setProcessing] = useState(false);

    // A new draft from the server (after a save or publish) replaces the editor's copy.
    // Done during render, as React recommends for resetting state from props.
    const [source, setSource] = useState(draftKey);

    if (draftKey !== source) {
        setSource(draftKey);
        setBlocks(JSON.parse(draftKey) as LandingBlock[]);
        setSaved(draftKey);
    }

    const dirty = JSON.stringify(blocks) !== saved;
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

    // Validation errors come back keyed by block, such as blocks.2.data.url. Select that block so the
    // admin sees which one to fix.
    const handleSaveErrors = useCallback(
        (errors: Record<string, string>, current: LandingBlock[]) => {
            const [firstKey, message] = Object.entries(errors)[0] ?? [];
            const index = Number(firstKey?.match(/^blocks\.(\d+)/)?.[1]);

            if (!Number.isNaN(index) && current[index]) {
                setSelectedId(current[index].id);
            }

            showError(message ?? t('The draft could not be saved.'));
        },
        [showError, t],
    );

    const save = () => {
        const submitted = blocks;

        router.put(
            saveDraft.url(),
            { blocks: submitted },
            {
                preserveScroll: true,
                onSuccess: () => setSaved(JSON.stringify(submitted)),
                onError: (errors) => handleSaveErrors(errors, submitted),
            },
        );
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
        setBlocks((current) =>
            current.map((item) => (item.id === block.id ? block : item)),
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

        setBlocks((current) => {
            const at = index ?? current.length;

            return [...current.slice(0, at), block, ...current.slice(at)];
        });
        setSelectedId(block.id);
    };

    const removeBlock = (id: string) => {
        setBlocks((current) => current.filter((block) => block.id !== id));
        setSelectedId((current) => (current === id ? null : current));
    };

    const moveBlock = (id: string, delta: number) =>
        setBlocks((current) => {
            const from = current.findIndex((block) => block.id === id);
            const to = from + delta;

            return from < 0 || to < 0 || to >= current.length
                ? current
                : arrayMove(current, from, to);
        });

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
                setBlocks(arrayMove(blocks, from, to));
            }
        }
    };

    return (
        <>
            <Head title={t('Visual editor')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Visual editor')}
                    description={t(
                        'Drag blocks onto the page, then edit their text and images. Save a draft, then publish it when it is ready.',
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
                    <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)_320px]">
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
                        </aside>

                        <Canvas
                            blocks={blocks}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            onMove={moveBlock}
                            onRemove={removeBlock}
                        />

                        <aside className="flex flex-col gap-4 rounded-lg border p-4">
                            {selected ? (
                                <>
                                    <div className="flex items-center justify-between gap-2">
                                        <h2 className="font-medium">
                                            {t(
                                                paletteTypes.find(
                                                    (item) =>
                                                        item.type ===
                                                        selected.type,
                                                )?.label ?? selected.type,
                                            )}
                                        </h2>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                removeBlock(selected.id)
                                            }
                                        >
                                            <Trash2 />
                                            {t('Remove block')}
                                        </Button>
                                    </div>
                                    <BlockFields
                                        block={selected}
                                        onChange={update}
                                        onError={showError}
                                    />
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    {t(
                                        'Select a block on the page to edit its text and images.',
                                    )}
                                </p>
                            )}
                        </aside>
                    </div>
                </DndContext>
            </div>

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
    selectedId,
    onSelect,
    onMove,
    onRemove,
}: {
    blocks: LandingBlock[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onMove: (id: string, delta: number) => void;
    onRemove: (id: string) => void;
}) {
    const t = useTrans();
    const { setNodeRef, isOver } = useDroppable({ id: 'canvas' });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'flex min-h-96 flex-col gap-3 rounded-lg border-2 border-dashed p-3',
                isOver && 'border-ring bg-muted/40',
            )}
        >
            <SortableContext
                items={blocks.map((block) => block.id)}
                strategy={verticalListSortingStrategy}
            >
                {blocks.length === 0 && (
                    <p className="m-auto text-sm text-muted-foreground">
                        {t('Drag a block here, or click one in the list.')}
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
                    />
                ))}
            </SortableContext>
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
}: {
    block: LandingBlock;
    index: number;
    total: number;
    selected: boolean;
    onSelect: () => void;
    onMove: (delta: number) => void;
    onRemove: () => void;
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
            {/* Links inside the preview do not open while editing. */}
            <div className="pointer-events-none p-2">
                <RenderBlock block={block} />
            </div>
        </div>
    );
}

LandingEditor.layout = {
    breadcrumbs: [
        {
            title: 'Landing page',
            href: indexAdminLanding(),
        },
    ],
};
