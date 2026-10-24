<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $page_id
 * @property int|null $user_id
 * @property string $title
 * @property list<array<string, mixed>> $content
 * @property string|null $label
 * @property Carbon|null $created_at
 */
class PageRevision extends Model
{
    protected $fillable = ['page_id', 'user_id', 'title', 'content', 'label'];

    protected function casts(): array
    {
        return ['content' => 'array'];
    }

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
