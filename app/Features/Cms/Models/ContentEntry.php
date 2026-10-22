<?php

namespace App\Features\Cms\Models;

use App\Features\Cms\Factories\ContentEntryFactory;
use App\Models\Concerns\BelongsToSite;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * One piece of content: a page, a post, or an entry of a custom post type.
 *
 * @property int $id
 * @property string $content_type
 * @property string $title
 * @property string $slug
 * @property string|null $excerpt
 * @property list<array{id: string, type: string, data: array<string, mixed>}>|null $body
 * @property string|null $featured_image
 * @property string $status
 * @property Carbon|null $published_at
 * @property int|null $author_id
 * @property array<string, mixed>|null $custom_fields
 * @property array{title?: string|null, description?: string|null, noindex?: bool}|null $seo
 * @property int $site_id
 * @property Carbon|null $deleted_at
 * @property Carbon|null $updated_at
 */
class ContentEntry extends Model
{
    use BelongsToSite;

    /** @use HasFactory<ContentEntryFactory> */
    use HasFactory;

    // Trashed entries are kept (see the trash in the admin). They are removed for good only on request.
    use SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const STATUSES = [self::STATUS_DRAFT, self::STATUS_PUBLISHED];

    protected $table = 'cms_entries';

    protected $fillable = [
        'content_type',
        'title',
        'slug',
        'excerpt',
        'body',
        'featured_image',
        'status',
        'published_at',
        'author_id',
        'custom_fields',
        'seo',
    ];

    protected function casts(): array
    {
        return [
            'body' => 'array',
            'custom_fields' => 'array',
            'seo' => 'array',
            'published_at' => 'datetime',
        ];
    }

    /**
     * Published and due. A published entry with no date counts as published now.
     *
     * @param  Builder<static>  $query
     */
    public function scopeLive(Builder $query): void
    {
        $query->where('status', self::STATUS_PUBLISHED)
            ->where(fn (Builder $inner) => $inner->whereNull('published_at')->orWhere('published_at', '<=', now()));
    }

    /**
     * @return BelongsTo<ContentType, $this>
     */
    public function contentType(): BelongsTo
    {
        return $this->belongsTo(ContentType::class, 'content_type', 'key');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * @return HasMany<Comment, $this>
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class, 'entry_id');
    }

    /**
     * @return BelongsToMany<Term, $this, Pivot>
     */
    public function terms(): BelongsToMany
    {
        return $this->belongsToMany(Term::class, 'cms_entry_terms', 'entry_id', 'term_id');
    }

    /**
     * Earlier versions of this entry, newest first.
     *
     * @return HasMany<ContentEntryRevision, $this>
     */
    public function revisions(): HasMany
    {
        return $this->hasMany(ContentEntryRevision::class, 'entry_id')->latest('id');
    }

    public function isLive(): bool
    {
        return $this->status === self::STATUS_PUBLISHED
            && ($this->published_at === null || $this->published_at->lte(now()));
    }

    protected static function newFactory(): ContentEntryFactory
    {
        return ContentEntryFactory::new();
    }
}
