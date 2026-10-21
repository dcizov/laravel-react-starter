<?php

namespace App\Features\Cms\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * A category or tag. Terms belong to every content type that supports them.
 *
 * @property int $id
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
        'taxonomy',
        'name',
        'slug',
    ];

    public function entries(): BelongsToMany
    {
        return $this->belongsToMany(ContentEntry::class, 'cms_entry_terms', 'term_id', 'entry_id');
    }
}
