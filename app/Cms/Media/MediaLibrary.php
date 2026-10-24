<?php

declare(strict_types=1);

namespace App\Cms\Media;

use App\Models\Media;
use App\Models\MediaFolder;
use App\Models\MediaUsage;
use App\Models\Page;
use App\Models\User;
use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Everything that touches media bytes: storing an upload, deriving a
 * thumbnail, and keeping the usage table honest.
 *
 * Deliberately free of HTTP concerns — the controller validates, this class
 * writes. That keeps uploads testable without a route and lets the seeder in a
 * later step create the demo library through the same code path.
 */
final class MediaLibrary
{
    /** Long edge of the single derived conversion. */
    public const THUMBNAIL_WIDTH = 480;

    private const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    public function disk(): string
    {
        return 'public';
    }

    /**
     * Store an upload and record it. The file keeps its extension; the name on
     * disk is a UUID so two `hero.jpg` uploads can coexist.
     */
    public function store(UploadedFile $file, ?int $folderId = null, ?User $uploader = null): Media
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'bin');
        $uuid = (string) Str::uuid();
        $directory = 'media/'.now()->format('Y/m');
        $filename = $uuid.'.'.$extension;

        $path = $file->storeAs($directory, $filename, $this->disk());

        if ($path === false) {
            throw new RuntimeException('The upload could not be written to disk.');
        }

        $mime = $file->getMimeType() ?: 'application/octet-stream';
        $dimensions = $this->dimensions($path, $mime);

        $media = Media::query()->create([
            'uuid' => $uuid,
            'folder_id' => $folderId,
            'disk' => $this->disk(),
            'path' => $path,
            'filename' => $filename,
            'original_name' => $file->getClientOriginalName(),
            'mime' => $mime,
            'type' => $this->typeFor($mime),
            'size' => (int) ($file->getSize() ?: 0),
            'width' => $dimensions[0] ?? null,
            'height' => $dimensions[1] ?? null,
            'uploaded_by' => $uploader?->id,
        ]);

        if ($media->isImage()) {
            $this->thumbnail($media);
        }

        return $media;
    }

    /**
     * Metadata edits (alt, caption, folder). Never rewrites the file.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Media $media, array $data): Media
    {
        $media->fill([
            'alt' => $data['alt'] ?? null,
            'caption' => $data['caption'] ?? null,
            'folder_id' => $data['folder_id'] ?? null,
        ])->save();

        return $media;
    }

    /**
     * Soft delete: the row (and therefore an undo) survives, the file stays on
     * disk until the row is force-deleted.
     */
    public function delete(Media $media): void
    {
        $media->delete();
    }

    public function restore(Media $media): Media
    {
        $media->restore();

        return $media;
    }

    /**
     * Drop the bytes as well. Only called from a deliberate purge.
     */
    public function purge(Media $media): void
    {
        $disk = Storage::disk($media->disk);

        foreach ([$media->path, $media->thumbnailPath()] as $path) {
            if ($disk->exists($path)) {
                $disk->delete($path);
            }
        }

        $media->usages()->delete();
        $media->forceDelete();
    }

    /**
     * @return array{0: int|null, 1: int|null}
     */
    public function dimensions(string $path, string $mime): array
    {
        if (! in_array($mime, self::IMAGE_TYPES, true)) {
            return [null, null];
        }

        $absolute = Storage::disk($this->disk())->path($path);
        $size = @getimagesize($absolute);

        return $size === false ? [null, null] : [(int) $size[0], (int) $size[1]];
    }

    /**
     * One square-ish thumbnail per image, written with GD so no extra package
     * is needed. Failures are silent: a missing thumbnail falls back to the
     * original in the UI.
     */
    public function thumbnail(Media $media): bool
    {
        if (! $media->isImage() || ! function_exists('imagecreatetruecolor')) {
            return false;
        }

        $disk = Storage::disk($media->disk);
        $source = $disk->path($media->path);

        $image = $this->readImage($source, $media->mime);

        if ($image === null) {
            return false;
        }

        $width = imagesx($image);
        $height = imagesy($image);
        $scale = min(1, self::THUMBNAIL_WIDTH / max(1, $width));
        $targetWidth = max(1, (int) round($width * $scale));
        $targetHeight = max(1, (int) round($height * $scale));

        $thumb = imagecreatetruecolor($targetWidth, $targetHeight);

        if ($thumb === false) {
            imagedestroy($image);

            return false;
        }

        // Keep transparency for PNG sources.
        imagealphablending($thumb, false);
        imagesavealpha($thumb, true);
        imagecopyresampled($thumb, $image, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

        $target = $disk->path($media->thumbnailPath());
        $directory = dirname($target);

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $written = imagejpeg($thumb, $target, 82);

        imagedestroy($thumb);
        imagedestroy($image);

        return (bool) $written;
    }

    /**
     * Rewrite the usage rows of a page. Called from the model events registered
     * in `AppServiceProvider`, so every save path — editor, autosave, restore,
     * duplicate — is covered without the callers knowing about media.
     */
    public function syncUsages(Page $page): void
    {
        MediaUsage::query()
            ->where('usable_type', $page->getMorphClass())
            ->where('usable_id', $page->getKey())
            ->delete();

        $references = [];

        if ($page->featured_media_id !== null) {
            $references[] = [(int) $page->featured_media_id, 'featured_media_id'];
        }

        if ($page->og_media_id !== null) {
            $references[] = [(int) $page->og_media_id, 'og_media_id'];
        }

        foreach ($this->scan($page->content, 'content') as $path => $field) {
            $id = $this->idForPath($path);

            if ($id !== null) {
                $references[] = [$id, $field];
            }
        }

        $seen = [];

        foreach ($references as [$mediaId, $field]) {
            $key = $mediaId.'|'.$field;

            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;

            MediaUsage::query()->create([
                'media_id' => $mediaId,
                'usable_type' => $page->getMorphClass(),
                'usable_id' => $page->getKey(),
                'field' => $field,
            ]);
        }
    }

    public function forgetUsages(Page $page): void
    {
        MediaUsage::query()
            ->where('usable_type', $page->getMorphClass())
            ->where('usable_id', $page->getKey())
            ->delete();
    }

    /**
     * Every `media field -> value` pair in a content tree. Section content is
     * free-form JSON, so a recursive walk is the only honest way to find media.
     *
     * @return array<string, string> value => dotted field path
     */
    public function scan(mixed $content, string $prefix = ''): array
    {
        $found = [];

        if (! is_array($content)) {
            return $found;
        }

        foreach ($content as $key => $value) {
            $path = $prefix === '' ? (string) $key : $prefix.'.'.$key;

            if (is_array($value)) {
                $found += $this->scan($value, $path);

                continue;
            }

            if (is_string($value) && str_contains($value, '/storage/')) {
                $found[$value] = $path;
            }
        }

        return $found;
    }

    /**
     * Media a page (or anything else) references, newest usage first.
     *
     * @return Collection<int, MediaUsage>
     */
    public function usagesOf(Media $media): Collection
    {
        return $media->usages()->with('usable')->latest()->get();
    }

    public function usageCount(Media $media): int
    {
        return $media->usages()->count();
    }

    /**
     * @return list<array{id: int, title: string, field: string|null, url: string|null}>
     */
    public function usageList(Media $media): array
    {
        return $this->usagesOf($media)
            ->map(function (MediaUsage $usage): array {
                $usable = $usage->usable;
                $title = $usable instanceof Page
                    ? $usable->title
                    : class_basename($usage->usable_type).' #'.$usage->usable_id;

                return [
                    'id' => (int) $usage->usable_id,
                    'title' => $title,
                    'field' => $usage->field,
                    'url' => $usable instanceof Page ? route('admin.pages.edit', $usable) : null,
                ];
            })
            ->values()
            ->all();
    }

    public function createFolder(string $name, ?int $parentId = null): MediaFolder
    {
        return MediaFolder::query()->create([
            'name' => $name,
            'slug' => MediaFolder::slugFor($name, $parentId),
            'parent_id' => $parentId,
        ]);
    }

    public function renameFolder(MediaFolder $folder, string $name): MediaFolder
    {
        $folder->fill([
            'name' => $name,
            'slug' => MediaFolder::slugFor($name, $folder->parent_id, $folder->id),
        ])->save();

        return $folder;
    }

    /**
     * Folders are flat containers: deleting one must never orphan its contents,
     * so the caller has to move them out first.
     */
    public function folderIsEmpty(MediaFolder $folder): bool
    {
        return ! $folder->children()->exists()
            && ! Media::query()->where('folder_id', $folder->id)->exists();
    }

    public function deleteFolder(MediaFolder $folder): void
    {
        if (! $this->folderIsEmpty($folder)) {
            throw new RuntimeException('Move the folder contents before deleting it.');
        }

        $folder->delete();
    }

    /**
     * @return list<array{id: int, name: string, slug: string, parent_id: int|null, depth: int, count: int}>
     */
    public function folderTree(): array
    {
        $folders = MediaFolder::query()
            ->withCount(['media', 'children'])
            ->orderBy('name')
            ->get();

        return $folders
            ->map(fn (MediaFolder $folder): array => [
                'id' => $folder->id,
                'name' => $folder->name,
                'slug' => $folder->slug,
                'parent_id' => $folder->parent_id,
                'depth' => $folder->depth(),
                'count' => (int) $folder->media_count,
            ])
            ->sortBy([['depth', 'asc'], ['name', 'asc']])
            ->values()
            ->all();
    }

    private function typeFor(string $mime): string
    {
        if (in_array($mime, self::IMAGE_TYPES, true)) {
            return 'image';
        }

        return match ($mime) {
            'application/pdf' => 'document',
            default => 'file',
        };
    }

    private function idForPath(string $url): ?int
    {
        $path = Str::after($url, '/storage/');

        return DB::table('media')
            ->where('path', $path)
            ->value('id');
    }

    private function readImage(string $absolute, string $mime): ?GdImage
    {
        if (! is_file($absolute)) {
            return null;
        }

        $image = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($absolute),
            'image/png' => @imagecreatefrompng($absolute),
            'image/webp' => @imagecreatefromwebp($absolute),
            'image/gif' => @imagecreatefromgif($absolute),
            default => false,
        };

        return $image instanceof GdImage ? $image : null;
    }
}
