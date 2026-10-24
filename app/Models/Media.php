<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * Minimal media record. The media library itself arrives in its own step; the
 * pages module only needs to reference a featured image.
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

    public function url(): string
    {
        return '/storage/'.ltrim($this->path, '/');
    }
}
