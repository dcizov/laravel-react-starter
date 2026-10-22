<?php

namespace App\Features\Cms\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * A category or tag. Each term belongs to one content type, and entries of that type can use it.
 *
 * @property int $id
 * @property string $content_type
 * @property string $taxonomy
 * @property string $name
 * @property string $slug
 */
class Term extends Model
{
    public const CATEGORY = 'category';

    public const TAG = 'tag';

    /** @var list<string> */
    public const TAXONOMIES = [self::CATEGORY, self::TAG];

    protected $table = 'cms_terms';

    protected $fillable = [
        'content_type',
        'taxonomy',
        'name',
        'slug',
    ];

    /**
     * Terms of one content type. Each type has its own categories and tags.
     */
    public function scopeForType(Builder $query, string $contentType): void
    {
        $query->where('content_type', $contentType);
    }

    public function entries(): BelongsToMany
    {
        return $this->belongsToMany(ContentEntry::class, 'cms_entry_terms', 'term_id', 'entry_id');
    }
}
