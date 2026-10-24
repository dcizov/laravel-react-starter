import { Head, router } from '@inertiajs/react';
import {
    FileText,
    FolderPlus,
    Grid2x2,
    ImageOff,
    List,
    Loader2,
    RotateCcw,
    Search,
    Trash2,
    Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

type MediaRow = {
    id: number;
    uuid: string;
    url: string;
    thumbnail_url: string | null;
    original_name: string;
    filename: string;
    mime: string;
    type: 'image' | 'document' | 'file';
    size: number;
    human_size: string;
    width: number | null;
    height: number | null;
    dimension_label: string | null;
    alt: string | null;
    caption: string | null;
    folder_id: number | null;
    folder: string | null;
    uploaded_by: string | null;
    usages: number;
    usages_detail: {
        id: number;
        title: string;
        field: string | null;
        url: string | null;
    }[];
    is_trashed: boolean;
    created_at: string | null;
    urls: { update: string; destroy: string; restore: string; show: string };
};

type Folder = {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
    depth: number;
    count: number;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
};

type Upload = {
    key: string;
    name: string;
    progress: number;
    status: 'queued' | 'uploading' | 'done' | 'error';
};

type Props = {
    media: Paginated<MediaRow>;
    folders: Folder[];
    filters: {
        q: string;
        type: string;
        folder: number | null;
        view: 'grid' | 'list';
        trashed: boolean;
    };
    counts: {
        all: number;
        image: number;
        document: number;
        other: number;
        trashed: number;
    };
    limits: { max_kilobytes: number; mimes: string };
    urls: { index: string; upload: string; folders: string };
    can: {
        upload: boolean;
        update: boolean;
        delete: boolean;
        folders: boolean;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Content', href: '/admin/media' },
    { title: 'Media', href: '/admin/media' },
];

/** Laravel paginator labels arrive HTML-escaped (`&laquo; Previous`). */
function plainLabel(label: string): string {
    return label
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .replace(/&amp;/g, '&');
}

export default function MediaIndex({
    media,
    folders,
    filters,
    counts,
    limits,
    urls,
    can,
}: Props) {
    const [search, setSearch] = useState(filters.q);
    const [dragging, setDragging] = useState(false);
    const [uploads, setUploads] = useState<Upload[]>([]);
    const [selected, setSelected] = useState<MediaRow | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<MediaRow | null>(null);
    const [folderDialog, setFolderDialog] = useState(false);
    const [folderName, setFolderName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const visit = (
        params: Record<string, string | number | boolean | undefined>,
    ) => {
        router.get(
            urls.index,
            params as Record<string, string | number | boolean>,
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    /**
     * Uploads run one file per visit so every file gets its own progress bar
     * and its own error. Inertia builds the multipart body for us.
     */
    const uploadFiles = (files: File[]) => {
        if (files.length === 0) {
            return;
        }

        const entries: Upload[] = files.map((file, index) => ({
            key: `${Date.now()}-${index}-${file.name}`,
            name: file.name,
            progress: 0,
            status: 'queued',
        }));

        setUploads((current) => [...entries, ...current]);

        const send = (index: number) => {
            const entry = entries[index];
            const file = files[index];

            if (entry === undefined || file === undefined) {
                return;
            }

            setUploads((current) =>
                current.map((item) =>
                    item.key === entry.key
                        ? { ...item, status: 'uploading' }
                        : item,
                ),
            );

            router.post(
                urls.upload,
                { files: [file], folder_id: filters.folder },
                {
                    forceFormData: true,
                    preserveScroll: true,
                    preserveState: true,
                    onProgress: (progress) => {
                        setUploads((current) =>
                            current.map((item) =>
                                item.key === entry.key
                                    ? {
                                          ...item,
                                          progress: progress?.percentage ?? 0,
                                      }
                                    : item,
                            ),
                        );
                    },
                    onSuccess: () => {
                        setUploads((current) =>
                            current.map((item) =>
                                item.key === entry.key
                                    ? { ...item, progress: 100, status: 'done' }
                                    : item,
                            ),
                        );
                        send(index + 1);
                    },
                    onError: (errors) => {
                        const message =
                            errors.files ??
                            Object.values(errors)[0] ??
                            'Upload failed.';

                        setUploads((current) =>
                            current.map((item) =>
                                item.key === entry.key
                                    ? { ...item, status: 'error' }
                                    : item,
                            ),
                        );
                        toast.error(`${entry.name}: ${message}`);
                        send(index + 1);
                    },
                },
            );
        };

        send(0);
    };

    const onDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragging(false);

        if (!can.upload) {
            return;
        }

        uploadFiles(Array.from(event.dataTransfer.files));
    };

    const saveMedia = (
        row: MediaRow,
        patch: {
            alt?: string | null;
            caption?: string | null;
            folder_id?: number | null;
        },
    ) => {
        router.patch(row.urls.update, patch, {
            preserveScroll: true,
            preserveState: true,
            onError: () => {
                toast.error('Change reverted', {
                    description: 'The media item was not updated.',
                });
            },
        });
    };

    const destroy = (row: MediaRow) => {
        setConfirmDelete(null);
        setSelected((current) => (current?.id === row.id ? null : current));

        router.delete(row.urls.destroy, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`“${row.original_name}” moved to trash`, {
                    description:
                        row.usages > 0
                            ? `It is still used in ${row.usages} place${row.usages === 1 ? '' : 's'}.`
                            : undefined,
                    action: {
                        label: 'Undo',
                        onClick: () =>
                            router.post(
                                row.urls.restore,
                                {},
                                { preserveScroll: true },
                            ),
                    },
                    duration: 8000,
                });
            },
            onError: () =>
                toast.error('Change reverted', {
                    description: 'The file could not be deleted.',
                }),
        });
    };

    const restore = (row: MediaRow) => {
        router.post(
            row.urls.restore,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(`“${row.original_name}” restored`),
            },
        );
    };

    const createFolder = () => {
        router.post(
            urls.folders,
            { name: folderName, parent_id: filters.folder },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setFolderDialog(false);
                    setFolderName('');
                },
            },
        );
    };

    const activeFolder =
        folders.find((folder) => folder.id === filters.folder) ?? null;
    const pending = uploads.filter(
        (upload) => upload.status === 'queued' || upload.status === 'uploading',
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Media" />

            <div className="space-y-5">
                <PageHeader
                    title="Media"
                    description={`${counts.all} files · ${counts.image} images · up to ${Math.round(limits.max_kilobytes / 1024)} MB per file`}
                    actions={
                        can.upload ? (
                            <>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    multiple
                                    accept={limits.mimes
                                        .split(',')
                                        .map((extension) => `.${extension}`)
                                        .join(',')}
                                    className="hidden"
                                    onChange={(event) => {
                                        uploadFiles(
                                            Array.from(
                                                event.target.files ?? [],
                                            ),
                                        );
                                        event.target.value = '';
                                    }}
                                />
                                <Button
                                    size="sm"
                                    onClick={() => inputRef.current?.click()}
                                >
                                    <Upload className="size-4" />
                                    Upload
                                </Button>
                            </>
                        ) : null
                    }
                />

                {pending.length > 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="space-y-2 p-3">
                            {uploads.slice(0, 6).map((upload) => (
                                <div
                                    key={upload.key}
                                    className="flex items-center gap-3 text-xs"
                                >
                                    {upload.status === 'done' ? (
                                        <RotateCcw className="size-3.5 text-status-published" />
                                    ) : upload.status === 'error' ? (
                                        <ImageOff className="size-3.5 text-status-error" />
                                    ) : (
                                        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                                    )}
                                    <span className="w-40 truncate">
                                        {upload.name}
                                    </span>
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition-[width]',
                                                upload.status === 'error'
                                                    ? 'bg-status-error'
                                                    : 'bg-primary',
                                            )}
                                            style={{
                                                width: `${upload.progress}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="w-10 text-right text-muted-foreground">
                                        {upload.progress}%
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ) : null}

                <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <aside className="space-y-1" aria-label="Folders">
                        <FolderButton
                            active={filters.folder === null && !filters.trashed}
                            onClick={() => visit({ view: filters.view })}
                        >
                            All media
                            <span className="ml-auto text-[11px] text-muted-foreground">
                                {counts.all}
                            </span>
                        </FolderButton>

                        {folders.map((folder) => (
                            <FolderButton
                                key={folder.id}
                                active={filters.folder === folder.id}
                                indent={folder.depth}
                                onClick={() =>
                                    visit({
                                        folder: folder.id,
                                        view: filters.view,
                                    })
                                }
                            >
                                {folder.name}
                                <span className="ml-auto text-[11px] text-muted-foreground">
                                    {folder.count}
                                </span>
                            </FolderButton>
                        ))}

                        {can.folders ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 w-full justify-start text-xs"
                                onClick={() => setFolderDialog(true)}
                            >
                                <FolderPlus className="size-3.5" />
                                New folder
                            </Button>
                        ) : null}

                        <div className="mt-3 space-y-1 border-t border-border/60 pt-2">
                            <FolderButton
                                active={filters.type === 'image'}
                                onClick={() =>
                                    visit({ type: 'image', view: filters.view })
                                }
                            >
                                Images
                                <span className="ml-auto text-[11px] text-muted-foreground">
                                    {counts.image}
                                </span>
                            </FolderButton>
                            <FolderButton
                                active={filters.type === 'document'}
                                onClick={() =>
                                    visit({
                                        type: 'document',
                                        view: filters.view,
                                    })
                                }
                            >
                                Documents
                                <span className="ml-auto text-[11px] text-muted-foreground">
                                    {counts.document}
                                </span>
                            </FolderButton>
                            <FolderButton
                                active={filters.trashed}
                                onClick={() =>
                                    visit({ trashed: true, view: filters.view })
                                }
                            >
                                Trash
                                <span className="ml-auto text-[11px] text-muted-foreground">
                                    {counts.trashed}
                                </span>
                            </FolderButton>
                        </div>
                    </aside>

                    <div
                        className={cn(
                            'min-w-0 space-y-4 rounded-lg transition-colors',
                            dragging && 'bg-primary/5 ring-2 ring-primary/50',
                        )}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative min-w-48 flex-1">
                                <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    placeholder="Search files, alt text or captions"
                                    className="pl-8"
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            visit({
                                                q: search,
                                                folder:
                                                    filters.folder ?? undefined,
                                                view: filters.view,
                                            });
                                        }
                                    }}
                                    onBlur={() => {
                                        if (search !== filters.q) {
                                            visit({
                                                q: search,
                                                folder:
                                                    filters.folder ?? undefined,
                                                view: filters.view,
                                            });
                                        }
                                    }}
                                />
                            </div>

                            <span className="text-xs text-muted-foreground">
                                {media.total} files
                            </span>

                            <div className="flex items-center rounded-md border border-border">
                                <Button
                                    variant={
                                        filters.view === 'grid'
                                            ? 'secondary'
                                            : 'ghost'
                                    }
                                    size="icon"
                                    className="size-8 rounded-r-none"
                                    aria-label="Grid view"
                                    onClick={() =>
                                        visit({
                                            q: filters.q,
                                            type: filters.type,
                                            folder: filters.folder ?? undefined,
                                            trashed: filters.trashed,
                                            view: 'grid',
                                        })
                                    }
                                >
                                    <Grid2x2 className="size-3.5" />
                                </Button>
                                <Button
                                    variant={
                                        filters.view === 'list'
                                            ? 'secondary'
                                            : 'ghost'
                                    }
                                    size="icon"
                                    className="size-8 rounded-l-none"
                                    aria-label="List view"
                                    onClick={() =>
                                        visit({
                                            q: filters.q,
                                            type: filters.type,
                                            folder: filters.folder ?? undefined,
                                            trashed: filters.trashed,
                                            view: 'list',
                                        })
                                    }
                                >
                                    <List className="size-3.5" />
                                </Button>
                            </div>
                        </div>

                        {media.data.length === 0 ? (
                            <EmptyState
                                icon={Upload}
                                title={
                                    filters.trashed
                                        ? 'Trash is empty'
                                        : 'No media yet'
                                }
                                description={
                                    filters.trashed
                                        ? 'Deleted files stay here until the library is purged.'
                                        : can.upload
                                          ? 'Drag files onto this area, or use the upload button. JPG, PNG, WebP, GIF and PDF up to 12 MB.'
                                          : 'Nothing has been uploaded yet.'
                                }
                            />
                        ) : filters.view === 'grid' ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                                {media.data.map((row) => (
                                    <div
                                        key={row.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setSelected(row)}
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === 'Enter' ||
                                                event.key === ' '
                                            ) {
                                                event.preventDefault();
                                                setSelected(row);
                                            }
                                        }}
                                        className="group overflow-hidden rounded-lg border border-border bg-card text-left transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                    >
                                        <div className="relative aspect-[4/3] bg-muted">
                                            {row.thumbnail_url ? (
                                                <img
                                                    src={row.thumbnail_url}
                                                    alt={
                                                        row.alt ??
                                                        row.original_name
                                                    }
                                                    loading="lazy"
                                                    className="size-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex size-full items-center justify-center text-muted-foreground">
                                                    <FileText className="size-6" />
                                                </div>
                                            )}
                                            {row.usages > 0 ? (
                                                <span className="absolute top-1.5 right-1.5 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                                                    used {row.usages}×
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="space-y-0.5 p-2">
                                            <p className="truncate text-xs font-medium">
                                                {row.original_name}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {row.human_size}
                                                {row.dimension_label
                                                    ? ` · ${row.dimension_label}`
                                                    : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Card className="overflow-hidden py-0">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium">
                                                File
                                            </th>
                                            <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">
                                                Folder
                                            </th>
                                            <th className="hidden px-3 py-2 text-left font-medium md:table-cell">
                                                Size
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {media.data.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="border-t border-border/60"
                                            >
                                                <td className="px-3 py-2">
                                                    <button
                                                        type="button"
                                                        className="flex items-center gap-2 text-left"
                                                        onClick={() =>
                                                            setSelected(row)
                                                        }
                                                    >
                                                        {row.thumbnail_url ? (
                                                            <img
                                                                src={
                                                                    row.thumbnail_url
                                                                }
                                                                alt=""
                                                                className="size-8 rounded object-cover"
                                                            />
                                                        ) : (
                                                            <span className="flex size-8 items-center justify-center rounded bg-muted">
                                                                <FileText className="size-3.5" />
                                                            </span>
                                                        )}
                                                        <span className="min-w-0">
                                                            <span className="block max-w-56 truncate font-medium">
                                                                {
                                                                    row.original_name
                                                                }
                                                            </span>
                                                            <span className="block text-[11px] text-muted-foreground">
                                                                {row.mime}
                                                            </span>
                                                        </span>
                                                    </button>
                                                </td>
                                                <td className="hidden px-3 py-2 text-xs sm:table-cell">
                                                    {row.folder ?? '—'}
                                                </td>
                                                <td className="hidden px-3 py-2 text-xs md:table-cell">
                                                    {row.human_size}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {row.is_trashed ? (
                                                        can.delete ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7"
                                                                onClick={() =>
                                                                    restore(row)
                                                                }
                                                            >
                                                                Restore
                                                            </Button>
                                                        ) : null
                                                    ) : can.delete ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7"
                                                            aria-label="Delete"
                                                            onClick={() =>
                                                                setConfirmDelete(
                                                                    row,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        )}

                        {media.links.length > 3 ? (
                            <nav
                                className="flex flex-wrap items-center justify-center gap-1"
                                aria-label="Pagination"
                            >
                                {media.links.map((link, slot) =>
                                    link.url ? (
                                        <Button
                                            key={link.url}
                                            size="sm"
                                            variant={
                                                link.active
                                                    ? 'secondary'
                                                    : 'ghost'
                                            }
                                            onClick={() =>
                                                router.get(
                                                    link.url as string,
                                                    {},
                                                    {
                                                        preserveState: true,
                                                        preserveScroll: true,
                                                    },
                                                )
                                            }
                                        >
                                            {plainLabel(link.label)}
                                        </Button>
                                    ) : (
                                        // Disabled gap links share a label, so position is the key.
                                        <Button
                                            // eslint-disable-next-line @eslint-react/no-array-index-key
                                            key={`gap-${slot}`}
                                            size="sm"
                                            variant="ghost"
                                            disabled
                                        >
                                            {plainLabel(link.label)}
                                        </Button>
                                    ),
                                )}
                            </nav>
                        ) : null}
                    </div>
                </div>
            </div>

            <MediaDrawer
                key={selected?.id ?? 'closed'}
                row={selected}
                folders={folders}
                can={can}
                onClose={() => setSelected(null)}
                onSave={saveMedia}
                onDelete={(row) => setConfirmDelete(row)}
            />

            <Dialog
                open={confirmDelete !== null}
                onOpenChange={(open) => (open ? null : setConfirmDelete(null))}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Delete “{confirmDelete?.original_name}”?
                        </DialogTitle>
                        <DialogDescription>
                            {confirmDelete && confirmDelete.usages > 0
                                ? `This file is used in ${confirmDelete.usages} place${confirmDelete.usages === 1 ? '' : 's'}. Those pages will show a broken image. You can undo this from the toast.`
                                : 'The file moves to the trash and can be restored from there.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setConfirmDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                confirmDelete && destroy(confirmDelete)
                            }
                        >
                            Delete file
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={folderDialog} onOpenChange={setFolderDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New folder</DialogTitle>
                        <DialogDescription>
                            {activeFolder
                                ? `Inside “${activeFolder.name}”.`
                                : 'At the top level of the library.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="folder-name">Folder name</Label>
                        <Input
                            id="folder-name"
                            value={folderName}
                            onChange={(event) =>
                                setFolderName(event.target.value)
                            }
                            placeholder="Brand assets"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setFolderDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={createFolder}
                            disabled={folderName.trim() === ''}
                        >
                            Create folder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function FolderButton({
    active,
    indent = 0,
    onClick,
    children,
}: {
    active: boolean;
    indent?: number;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{ paddingLeft: `${8 + indent * 12}px` }}
            className={cn(
                'flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm transition-colors',
                active
                    ? 'bg-primary/10 font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted',
            )}
        >
            {children}
        </button>
    );
}

function MediaDrawer({
    row,
    folders,
    can,
    onClose,
    onSave,
    onDelete,
}: {
    row: MediaRow | null;
    folders: Folder[];
    can: { update: boolean; delete: boolean };
    onClose: () => void;
    onSave: (
        row: MediaRow,
        patch: {
            alt?: string | null;
            caption?: string | null;
            folder_id?: number | null;
        },
    ) => void;
    onDelete: (row: MediaRow) => void;
}) {
    // The drawer is keyed by media id, so these drafts seed once per file.
    const [alt, setAlt] = useState(row?.alt ?? '');
    const [caption, setCaption] = useState(row?.caption ?? '');

    return (
        <Sheet
            open={row !== null}
            onOpenChange={(open) => (open ? null : onClose())}
        >
            <SheetContent className="w-full sm:max-w-md">
                {row === null ? (
                    <SheetSkeleton />
                ) : (
                    <>
                        <SheetHeader>
                            <SheetTitle className="truncate">
                                {row.original_name}
                            </SheetTitle>
                            <SheetDescription>
                                {row.mime} · {row.human_size}
                                {row.dimension_label
                                    ? ` · ${row.dimension_label}`
                                    : ''}
                                {row.uploaded_by ? ` · ${row.uploaded_by}` : ''}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="space-y-4 overflow-y-auto px-4 pb-8">
                            <div className="overflow-hidden rounded-md bg-muted">
                                {row.type === 'image' ? (
                                    <img
                                        src={row.url}
                                        alt={row.alt ?? row.original_name}
                                        className="max-h-56 w-full object-contain"
                                    />
                                ) : (
                                    <div className="flex h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
                                        <FileText className="size-4" />
                                        {row.type === 'document'
                                            ? 'Document'
                                            : 'File'}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="media-alt" className="text-xs">
                                    Alt text
                                </Label>
                                <Input
                                    id="media-alt"
                                    value={alt}
                                    readOnly={!can.update}
                                    placeholder="Describe the image for screen readers"
                                    onChange={(event) =>
                                        setAlt(event.target.value)
                                    }
                                    onBlur={() => {
                                        if (alt !== (row.alt ?? '')) {
                                            onSave(row, {
                                                alt: alt === '' ? null : alt,
                                            });
                                        }
                                    }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="media-caption"
                                    className="text-xs"
                                >
                                    Caption
                                </Label>
                                <textarea
                                    id="media-caption"
                                    value={caption}
                                    readOnly={!can.update}
                                    rows={2}
                                    onChange={(event) =>
                                        setCaption(event.target.value)
                                    }
                                    onBlur={() => {
                                        if (caption !== (row.caption ?? '')) {
                                            onSave(row, {
                                                caption:
                                                    caption === ''
                                                        ? null
                                                        : caption,
                                            });
                                        }
                                    }}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Folder</Label>
                                <Select
                                    value={
                                        row.folder_id === null
                                            ? 'root'
                                            : String(row.folder_id)
                                    }
                                    onValueChange={(value) =>
                                        onSave(row, {
                                            folder_id:
                                                value === 'root'
                                                    ? null
                                                    : Number(value),
                                        })
                                    }
                                    disabled={!can.update}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="root">
                                            Unfiled
                                        </SelectItem>
                                        {folders.map((folder) => (
                                            <SelectItem
                                                key={folder.id}
                                                value={String(folder.id)}
                                            >
                                                {folder.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 border-t border-border/60 pt-3">
                                <h3 className="text-xs font-semibold">
                                    Used in {row.usages} place
                                    {row.usages === 1 ? '' : 's'}
                                </h3>
                                {row.usages_detail.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        Nothing links to this file yet.
                                    </p>
                                ) : (
                                    <ul className="space-y-1">
                                        {row.usages_detail.map((usage) => (
                                            <li
                                                key={`${usage.id}-${usage.field ?? 'file'}`}
                                                className="flex items-center justify-between gap-2 text-xs"
                                            >
                                                <span className="min-w-0 truncate">
                                                    {usage.title}
                                                </span>
                                                {usage.url ? (
                                                    <a
                                                        href={usage.url}
                                                        className="shrink-0 text-primary hover:underline"
                                                    >
                                                        Edit page
                                                    </a>
                                                ) : null}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="flex items-center gap-2 border-t border-border/60 pt-3">
                                <Button variant="outline" size="sm" asChild>
                                    <a
                                        href={row.url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Open original
                                    </a>
                                </Button>
                                {can.delete && !row.is_trashed ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-status-error"
                                        onClick={() => onDelete(row)}
                                    >
                                        <Trash2 className="size-3.5" />
                                        Delete
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

function SheetSkeleton() {
    return (
        <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
        </div>
    );
}
