<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A slug the page used to live at. Old URLs answer with a permanent redirect.
 */
class PageSlug extends Model
{
    protected $fillable = ['page_id', 'slug'];

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }
}
