<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * A file in the media library. The bytes live on a Laravel disk; this record
 * owns the metadata, the folder and the (derived) thumbnail path.
 *
 * @property int $id
 * @property string $uuid
 * @property string $disk
 * @property string $path
 * @property string $filename
 * @property string $original_name
 * @property string $mime
 * @property string $type
 * @property int $size
 * @property int|null $width
 * @property int|null $height
 * @property string|null $alt
 * @property string|null $caption
 * @property Carbon|null $created_at
 */
class Media extends Model
{
    use SoftDeletes;

    protected $table = 'media';

    protected $fillable = [
        'uuid', 'folder_id', 'disk', 'path', 'filename', 'original_name', 'mime',
        'type', 'size', 'width', 'height', 'alt', 'caption', 'uploaded_by',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(MediaFolder::class, 'folder_id');
    }

    public function usages(): HasMany
    {
        return $this->hasMany(MediaUsage::class);
    }

    public function url(): string
    {
        return '/storage/'.ltrim($this->path, '/');
    }

    /**
     * Thumbnails sit next to the original in a `thumbs` folder, so moving a
     * media row between folders never rewrites a path.
     */
    public function thumbnailPath(): string
    {
        return dirname($this->path).'/thumbs/'.basename($this->path);
    }

    public function thumbnailUrl(): ?string
    {
        if (! $this->isImage() || ! Storage::disk($this->disk)->exists($this->thumbnailPath())) {
            return null;
        }

        return '/storage/'.ltrim($this->thumbnailPath(), '/');
    }

    public function isImage(): bool
    {
        return $this->type === 'image';
    }

    public function humanSize(): string
    {
        $size = max(0, (int) $this->size);

        foreach (['B', 'KB', 'MB', 'GB'] as $unit) {
            if ($size < 1024 || $unit === 'GB') {
                return $unit === 'B' ? "{$size} B" : number_format($size, 1).' '.$unit;
            }

            $size /= 1024;
        }

        return $size.' B';
    }

    public function dimensionLabel(): ?string
    {
        return $this->width !== null && $this->height !== null ? "{$this->width} × {$this->height}" : null;
    }
}
