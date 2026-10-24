<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $title
 * @property string $slug
 * @property string $status
 * @property string $template
 * @property int|null $parent_id
 * @property int|null $author_id
 * @property string|null $excerpt
 * @property int|null $featured_media_id
 * @property list<array<string, mixed>> $content
 * @property string|null $seo_title
 * @property string|null $seo_description
 * @property int|null $og_media_id
 * @property string $robots
 * @property Carbon|null $published_at
 * @property Carbon|null $scheduled_at
 * @property int $version
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
class Page extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SCHEDULED = 'scheduled';

    public const STATUS_PUBLISHED = 'published';

    public const STATUSES = [self::STATUS_DRAFT, self::STATUS_SCHEDULED, self::STATUS_PUBLISHED];

    protected $fillable = [
        'title', 'slug', 'status', 'template', 'parent_id', 'author_id', 'excerpt',
        'featured_media_id', 'content', 'seo_title', 'seo_description', 'og_media_id',
        'robots', 'published_at', 'scheduled_at', 'version',
    ];

    protected function casts(): array
    {
        return [
            'content' => 'array',
            'published_at' => 'datetime',
            'scheduled_at' => 'datetime',
            'version' => 'integer',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(PageRevision::class)->latest('id');
    }

    public function slugs(): HasMany
    {
        return $this->hasMany(PageSlug::class);
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED
            && $this->published_at !== null
            && $this->published_at->isPast();
    }

    /**
     * The page is publicly reachable only when it is published.
     */
    public function isPubliclyVisible(): bool
    {
        return $this->isPublished();
    }
}
