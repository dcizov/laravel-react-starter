<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * One entry in a site menu. An item either points at a page (by id, so a slug
 * rename keeps the link working) or at an arbitrary URL.
 *
 * @property int $id
 * @property string $menu
 * @property int|null $parent_id
 * @property string $label
 * @property string $type
 * @property int|null $page_id
 * @property string|null $url
 * @property int $position
 * @property Carbon|null $created_at
 */
class MenuItem extends Model
{
    public const TYPE_PAGE = 'page';

    public const TYPE_URL = 'url';

    protected $fillable = ['menu', 'parent_id', 'label', 'type', 'page_id', 'url', 'position'];

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('position');
    }

    /**
     * The href this item resolves to right now. A page that was deleted or
     * unpublished degrades to the home page instead of a 404 link.
     */
    public function href(): string
    {
        if ($this->type === self::TYPE_PAGE) {
            $page = $this->page;

            if ($page === null || ! $page->isPubliclyVisible()) {
                return '/';
            }

            return $page->slug === 'home' ? '/' : '/'.$page->slug;
        }

        return $this->url !== null && $this->url !== '' ? $this->url : '/';
    }
}
