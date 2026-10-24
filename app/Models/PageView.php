<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A single hit on a public page. Rows only ever carry the path, an optional
 * page and the referrer — no IP address, no user agent, no cookie.
 */
class PageView extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['path', 'page_id', 'referrer', 'created_at'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    /**
     * @return BelongsTo<Page, $this>
     */
    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }
}
