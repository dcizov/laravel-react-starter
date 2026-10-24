import { useHttp } from '@inertiajs/react';
import { Check, ImagePlus, Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type MediaItem = {
    id: number;
    url: string;
    thumbnail_url: string | null;
    original_name: string;
    alt: string | null;
    type: string;
    human_size: string;
    dimension_label: string | null;
    folder: string | null;
    usages: number;
};

type FolderOption = {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
    depth: number;
    count: number;
};

type BrowseQuery = { q: string; folder: string };

type BrowseResponse = {
    media: MediaItem[];
    folders: FolderOption[];
    upload_url: string;
    can: { upload: boolean };
};

const BROWSE_URL = '/admin/media/browse';

/**
 * Shared media picker. It reads the library through the JSON browse endpoint
 * instead of a page visit, so opening it inside the editor never re-renders
 * (or discards) the page being edited.
 */
export function MediaPicker({
    open,
    onOpenChange,
    onSelect,
    currentUrl,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (item: MediaItem) => void;
    currentUrl?: string | null;
}) {
    const [query, setQuery] = useState('');
    const [folder, setFolder] = useState('all');
    const [items, setItems] = useState<MediaItem[]>([]);
    const [folders, setFolders] = useState<FolderOption[]>([]);
    const [canUpload, setCanUpload] = useState(false);
    const [loading, setLoading] = useState(false);

    // The hook reads its query through this ref, so a filter change and the
    // request that follows it never race.
    const queryRef = useRef<BrowseQuery>({ q: '', folder: '' });
    const browse = useHttp<BrowseQuery, BrowseResponse>(
        'get',
        BROWSE_URL,
        () => queryRef.current,
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        queryRef.current = { q: query, folder: folder === 'all' ? '' : folder };

        browse.get(BROWSE_URL, {
            onStart: () => setLoading(true),
            onSuccess: (response) => {
                setItems(response.media);
                setFolders(response.folders);
                setCanUpload(response.can.upload);
                setLoading(false);
            },
            onError: () => {
                setLoading(false);
                toast.error('The media library could not be loaded');
            },
            onNetworkError: () => setLoading(false),
        });
        // `browse` is a fresh hook object each render; the query state is what
        // actually drives the request.
        // eslint-disable-next-line @eslint-react/exhaustive-deps
    }, [open, query, folder]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Choose media</DialogTitle>
                    <DialogDescription>
                        Pick a file from the library. Alt text lives with the
                        file — edit it in the media library.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-40 flex-1">
                        <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search the library"
                            className="pl-8"
                            aria-label="Search media"
                        />
                    </div>

                    <Select value={folder} onValueChange={setFolder}>
                        <SelectTrigger className="w-40" aria-label="Folder">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All folders</SelectItem>
                            {folders.map((option) => (
                                <SelectItem
                                    key={option.id}
                                    value={String(option.id)}
                                >
                                    {option.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="max-h-[52vh] min-h-48 overflow-y-auto pr-1">
                    {loading ? (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {[0, 1, 2, 3, 4, 5, 6, 7].map((slot) => (
                                <Skeleton
                                    key={slot}
                                    className="aspect-[4/3] w-full"
                                />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                            <ImagePlus className="size-6 text-muted-foreground" />
                            <p className="text-sm font-medium">
                                No files match
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {canUpload
                                    ? 'Upload files in the media library, then come back here.'
                                    : 'Try another search term.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {items.map((item) => {
                                const active = currentUrl === item.url;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => onSelect(item)}
                                        className={cn(
                                            'group overflow-hidden rounded-md border text-left transition-colors',
                                            active
                                                ? 'border-primary ring-2 ring-primary/30'
                                                : 'border-border hover:border-primary/50',
                                        )}
                                    >
                                        <div className="relative aspect-[4/3] bg-muted">
                                            {item.thumbnail_url ? (
                                                <img
                                                    src={item.thumbnail_url}
                                                    alt={
                                                        item.alt ??
                                                        item.original_name
                                                    }
                                                    loading="lazy"
                                                    className="size-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex size-full items-center justify-center text-[11px] text-muted-foreground">
                                                    {(
                                                        item.original_name
                                                            .split('.')
                                                            .pop() ?? ''
                                                    ).toUpperCase()}
                                                </div>
                                            )}
                                            {active ? (
                                                <span className="absolute top-1 right-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                                                    <Check className="size-3" />
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="truncate px-1.5 py-1 text-[11px]">
                                            {item.original_name}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2">
                    <p className="text-[11px] text-muted-foreground">
                        {loading ? (
                            <span className="flex items-center gap-1">
                                <Loader2 className="size-3 animate-spin" />{' '}
                                Loading…
                            </span>
                        ) : (
                            `${items.length} file${items.length === 1 ? '' : 's'}`
                        )}
                    </p>
                    {canUpload ? (
                        <Button variant="ghost" size="sm" asChild>
                            <a
                                href="/admin/media"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Upload in media library
                            </a>
                        </Button>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * The editor's `media` field: an image preview with replace/remove, backed by
 * the picker. The stored value is the file's public URL, which is what the
 * renderer needs and what the usage scanner matches on.
 */
export function MediaField({
    id,
    value,
    onChange,
    disabled = false,
}: {
    id?: string;
    value: string | null;
    onChange: (value: string | null) => void;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-2" id={id}>
            {value ? (
                <div className="relative overflow-hidden rounded-md border border-border">
                    <img
                        src={value}
                        alt=""
                        className="aspect-video w-full object-cover"
                    />
                    {!disabled ? (
                        <div className="absolute top-1 right-1 flex gap-1">
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="h-7"
                                onClick={() => setOpen(true)}
                            >
                                Replace
                            </Button>
                            <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                className="size-7"
                                aria-label="Remove image"
                                onClick={() => onChange(null)}
                            >
                                <X className="size-3.5" />
                            </Button>
                        </div>
                    ) : null}
                </div>
            ) : (
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpen(true)}
                    className="flex w-full flex-col items-center gap-1 rounded-md border border-dashed border-border px-3 py-6 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
                >
                    <ImagePlus className="size-5" />
                    Choose an image
                </button>
            )}

            <MediaPicker
                open={open}
                onOpenChange={setOpen}
                currentUrl={value}
                onSelect={(item) => {
                    onChange(item.url);
                    setOpen(false);
                }}
            />
        </div>
    );
}
