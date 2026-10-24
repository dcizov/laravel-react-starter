<?php

declare(strict_types=1);

namespace App\Addons\PostCraft\Models;

use App\Models\Media;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $title
 * @property string $slug
 * @property int|null $category_id
 * @property int|null $author_id
 * @property int|null $featured_media_id
 * @property string|null $excerpt
 * @property string $body
 * @property string $status
 * @property Carbon|null $published_at
 * @property Carbon|null $created_at
 */
class Post extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const STATUSES = [self::STATUS_DRAFT, self::STATUS_PUBLISHED];

    protected $fillable = [
        'title', 'slug', 'category_id', 'author_id', 'featured_media_id',
        'excerpt', 'body', 'status', 'published_at',
    ];

    protected function casts(): array
    {
        return ['published_at' => 'datetime'];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * @return BelongsTo<Media, $this>
     */
    public function featuredMedia(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'featured_media_id');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    /**
     * Published means published *and* dated in the past: a post scheduled for
     * next week must not leak onto the blog early.
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLISHED)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function isLive(): bool
    {
        return $this->status === self::STATUS_PUBLISHED
            && $this->published_at !== null
            && $this->published_at->isPast();
    }

    public function readingMinutes(): int
    {
        $words = str_word_count(strip_tags($this->body));

        return max(1, (int) round($words / 220));
    }

    /**
     * Post bodies are plain text with blank-line paragraphs and `## ` headings,
     * rendered by the frontend. No HTML is stored or trusted.
     *
     * @return list<array{type: string, text: string}>
     */
    public function blocks(): array
    {
        $blocks = [];

        foreach (preg_split('/\n{2,}/', trim($this->body)) ?: [] as $chunk) {
            $chunk = trim($chunk);

            if ($chunk === '') {
                continue;
            }

            if (str_starts_with($chunk, '## ')) {
                $blocks[] = ['type' => 'heading', 'text' => trim(substr($chunk, 3))];

                continue;
            }

            if (str_starts_with($chunk, '> ')) {
                $blocks[] = ['type' => 'quote', 'text' => trim(substr($chunk, 2))];

                continue;
            }

            $blocks[] = ['type' => 'paragraph', 'text' => $chunk];
        }

        return $blocks;
    }

    public function url(): string
    {
        return '/blog/'.$this->slug;
    }

    public static function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'post';
        $slug = $base;
        $suffix = 2;

        while (self::withTrashed()
            ->where('slug', $slug)
            ->when($ignoreId !== null, fn (Builder $query) => $query->whereKeyNot($ignoreId))
            ->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }
}
