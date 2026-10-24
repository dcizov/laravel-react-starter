<?php

declare(strict_types=1);

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

    public const DEFAULT_ROBOTS = 'index,follow';

    /**
     * Robots directives a page may carry.
     *
     * Every value contains a comma, which is why validation must use
     * `Rule::in(self::ROBOTS)`: the string form `in:index,follow,…` is split on
     * commas by the validator, so no value with a comma in it could ever match.
     *
     * @var list<string>
     */
    public const ROBOTS = [
        'index,follow',
        'index,nofollow',
        'noindex,follow',
        'noindex,nofollow',
    ];

    /**
     * Labels for the editor's select, so the client never keeps a second copy
     * of the allowed values.
     *
     * @return list<array{value: string, label: string}>
     */
    public static function robotsOptions(): array
    {
        $labels = [
            'index,follow' => 'Index, follow',
            'index,nofollow' => 'Index, no follow',
            'noindex,follow' => 'No index, follow',
            'noindex,nofollow' => 'No index, no follow',
        ];

        return array_map(
            fn (string $value): array => ['value' => $value, 'label' => $labels[$value]],
            self::ROBOTS,
        );
    }

    /**
     * Coerce a submitted value to something storable: a known directive wins,
     * anything else (null, empty string, junk from an import) falls back to the
     * current value and finally to the default.
     */
    public static function normalizeRobots(mixed $value, ?string $fallback = null): string
    {
        if (is_string($value) && in_array($value, self::ROBOTS, true)) {
            return $value;
        }

        return $fallback ?? self::DEFAULT_ROBOTS;
    }

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
