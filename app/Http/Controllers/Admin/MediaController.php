<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Cms\Media\MediaLibrary;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MediaFolderRequest;
use App\Http\Requests\Admin\UpdateMediaRequest;
use App\Http\Requests\Admin\UploadMediaRequest;
use App\Models\Media;
use App\Models\MediaFolder;
use App\Models\MediaUsage;
use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    public function __construct(private readonly MediaLibrary $library) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Media::class);

        $filters = [
            'q' => trim((string) $request->query('q', '')),
            'type' => (string) $request->query('type', ''),
            'folder' => $request->filled('folder') ? (int) $request->query('folder') : null,
            'view' => $request->query('view') === 'list' ? 'list' : 'grid',
            'trashed' => $request->boolean('trashed'),
        ];

        $media = Media::query()
            ->with(['uploader:id,name', 'folder:id,name'])
            ->withCount('usages')
            ->when($filters['trashed'], fn ($query) => $query->onlyTrashed())
            ->when($filters['q'] !== '', fn ($query) => $query->where(function ($query) use ($filters): void {
                $query->where('original_name', 'like', "%{$filters['q']}%")
                    ->orWhere('alt', 'like', "%{$filters['q']}%")
                    ->orWhere('caption', 'like', "%{$filters['q']}%");
            }))
            ->when(
                in_array($filters['type'], ['image', 'document', 'file'], true),
                fn ($query) => $query->where('type', $filters['type']),
            )
            ->when($filters['folder'] !== null, fn ($query) => $query->where('folder_id', $filters['folder']))
            ->orderByDesc('id')
            ->paginate(24)
            ->withQueryString()
            ->through(fn (Media $item): array => $this->row($item));

        return Inertia::render('admin/media/index', [
            'media' => $media,
            'folders' => $this->library->folderTree(),
            'filters' => $filters,
            'counts' => [
                'all' => Media::query()->count(),
                'image' => Media::query()->where('type', 'image')->count(),
                'document' => Media::query()->where('type', 'document')->count(),
                'other' => Media::query()->whereNotIn('type', ['image', 'document'])->count(),
                'trashed' => Media::onlyTrashed()->count(),
            ],
            'limits' => [
                'max_kilobytes' => UploadMediaRequest::MAX_KILOBYTES,
                'mimes' => UploadMediaRequest::MIMES,
            ],
            'urls' => [
                'index' => route('admin.media.index'),
                'upload' => route('admin.media.upload'),
                'folders' => route('admin.media.folders.store'),
            ],
            'can' => [
                'upload' => $request->user()?->can('create', Media::class) ?? false,
                'update' => $request->user()?->can('media.update') ?? false,
                'delete' => $request->user()?->can('media.delete') ?? false,
                'folders' => $request->user()?->can('manageFolders', Media::class) ?? false,
            ],
        ]);
    }

    /**
     * Lightweight browser for the picker modal: no pagination chrome, just the
     * newest 60 matches plus the folder list. The editor never renders this as
     * a page, so it is deliberately JSON.
     */
    public function browse(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Media::class);

        $search = trim((string) $request->query('q', ''));
        $folder = $request->filled('folder') ? (int) $request->query('folder') : null;

        $media = Media::query()
            ->with(['folder:id,name'])
            ->withCount('usages')
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $query->where('original_name', 'like', "%{$search}%")
                    ->orWhere('alt', 'like', "%{$search}%");
            }))
            ->when($folder !== null, fn ($query) => $query->where('folder_id', $folder))
            ->orderByDesc('id')
            ->limit(60)
            ->get()
            ->map(fn (Media $item): array => [
                'id' => $item->id,
                'url' => $item->url(),
                'thumbnail_url' => $item->thumbnailUrl(),
                'original_name' => $item->original_name,
                'alt' => $item->alt,
                'type' => $item->type,
                'human_size' => $item->humanSize(),
                'dimension_label' => $item->dimensionLabel(),
                'folder' => $item->folder?->name,
                'usages' => (int) $item->usages_count,
            ])
            ->values();

        return response()->json([
            'media' => $media,
            'folders' => $this->library->folderTree(),
            'upload_url' => route('admin.media.upload'),
            'can' => [
                'upload' => $request->user()?->can('create', Media::class) ?? false,
            ],
        ]);
    }

    /**
     * Multi-upload. One bad file fails the whole request with per-file errors,
     * so the UI can name the file that was rejected instead of silently
     * dropping it.
     */
    public function upload(UploadMediaRequest $request): RedirectResponse
    {
        $folderId = $request->filled('folder_id') ? (int) $request->input('folder_id') : null;
        $stored = 0;

        foreach ($request->file('files') as $file) {
            $this->library->store($file, $folderId, $request->user());
            $stored++;
        }

        activity('media')
            ->event('uploaded')
            ->log($stored === 1 ? 'Uploaded 1 file' : "Uploaded {$stored} files");

        return back()->with('toast', [
            'type' => 'success',
            'message' => $stored === 1 ? 'File uploaded.' : "{$stored} files uploaded.",
        ]);
    }

    public function update(UpdateMediaRequest $request, Media $media): RedirectResponse
    {
        $this->library->update($media, $request->validated());

        return back()->with('toast', ['type' => 'success', 'message' => 'Media updated.']);
    }

    /**
     * Usage is a warning, not a veto: editors may delete an image that is still
     * on a page, and the undo toast restores it. The response carries the usage
     * count so the toast can say what broke.
     */
    public function destroy(Request $request, Media $media): RedirectResponse
    {
        $this->authorize('delete', $media);

        $usages = $this->library->usageCount($media);

        $this->library->delete($media);

        activity('media')
            ->performedOn($media)
            ->event('deleted')
            ->log('Deleted "'.$media->original_name.'"');

        return back()->with('toast', [
            'type' => $usages > 0 ? 'warning' : 'success',
            'message' => $usages > 0
                ? '“'.$media->original_name.'” is still used in '.$usages.' place'.($usages === 1 ? '' : 's').'.'
                : '“'.$media->original_name.'” deleted.',
        ]);
    }

    public function restore(int $id): RedirectResponse
    {
        $media = Media::withTrashed()->findOrFail($id);

        $this->authorize('restore', $media);

        $this->library->restore($media);

        return back()->with('toast', ['type' => 'success', 'message' => '“'.$media->original_name.'” restored.']);
    }

    public function storeFolder(MediaFolderRequest $request): RedirectResponse
    {
        $folder = $this->library->createFolder(
            (string) $request->validated('name'),
            $request->filled('parent_id') ? (int) $request->validated('parent_id') : null,
        );

        return back()->with('toast', ['type' => 'success', 'message' => 'Folder “'.$folder->name.'” created.']);
    }

    public function updateFolder(MediaFolderRequest $request, MediaFolder $folder): RedirectResponse
    {
        $this->library->renameFolder($folder, (string) $request->validated('name'));

        return back()->with('toast', ['type' => 'success', 'message' => 'Folder renamed.']);
    }

    public function destroyFolder(MediaFolder $folder): RedirectResponse
    {
        $this->authorize('manageFolders', Media::class);

        if (! $this->library->folderIsEmpty($folder)) {
            return back()->withErrors(['folder' => 'Move the folder contents before deleting “'.$folder->name.'”.']);
        }

        $this->library->deleteFolder($folder);

        return back()->with('toast', ['type' => 'success', 'message' => 'Folder deleted.']);
    }

    /**
     * Where one item is used. The index deliberately ships only the count, so
     * this is fetched when the drawer opens: the payload then scales with what
     * the operator is looking at rather than with every reused image on screen.
     */
    public function usages(Media $media): JsonResponse
    {
        $this->authorize('view', $media);

        $media->load('usages.usable');

        return response()->json(['usages' => $this->usageRows($media)]);
    }

    /**
     * Where the item is used, resolved from the eager-loaded relation.
     *
     * @return list<array{id: int, title: string, field: string|null, url: string|null}>
     */
    private function usageRows(Media $media): array
    {
        return $media->usages
            ->map(function (MediaUsage $usage): array {
                $usable = $usage->usable;

                return [
                    'id' => (int) $usage->usable_id,
                    'title' => $usable instanceof Page
                        ? $usable->title
                        : class_basename($usage->usable_type).' #'.$usage->usable_id,
                    'field' => $usage->field,
                    'url' => $usable instanceof Page ? route('admin.pages.edit', $usable) : null,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function row(Media $media): array
    {
        return [
            'id' => $media->id,
            'uuid' => $media->uuid,
            'url' => $media->url(),
            'thumbnail_url' => $media->thumbnailUrl(),
            'original_name' => $media->original_name,
            'filename' => $media->filename,
            'mime' => $media->mime,
            'type' => $media->type,
            'size' => $media->size,
            'human_size' => $media->humanSize(),
            'width' => $media->width,
            'height' => $media->height,
            'dimension_label' => $media->dimensionLabel(),
            'alt' => $media->alt,
            'caption' => $media->caption,
            'folder_id' => $media->folder_id,
            'folder' => $media->folder?->name,
            'uploaded_by' => $media->uploader?->name,
            'usages' => (int) ($media->usages_count ?? $media->usages()->count()),
            'is_trashed' => $media->trashed(),
            'created_at' => $media->created_at?->toIso8601String(),
            'urls' => [
                'update' => route('admin.media.update', $media),
                'destroy' => route('admin.media.destroy', $media),
                'restore' => route('admin.media.restore', $media->id),
                'usages' => route('admin.media.usages', $media),
            ],
        ];
    }
}
