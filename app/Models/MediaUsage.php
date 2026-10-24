<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

/**
 * One place a media item is referenced. Rewritten whenever the owner is saved,
 * which is what makes "this image is used on About" trustworthy.
 *
 * @property int $id
 * @property int $media_id
 * @property string $usable_type
 * @property int $usable_id
 * @property string|null $field
 * @property Carbon|null $created_at
 */
class MediaUsage extends Model
{
    protected $fillable = ['media_id', 'usable_type', 'usable_id', 'field'];

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }

    public function usable(): MorphTo
    {
        return $this->morphTo();
    }
}
