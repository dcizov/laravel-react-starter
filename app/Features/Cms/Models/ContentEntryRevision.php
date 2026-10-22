<?php

namespace App\Features\Cms\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A saved version of an entry, taken just before a change. Restoring one copies it back onto the entry, and the
 * entry's previous state is then saved as a revision too, so a restore can itself be undone.
 *
 * Terms are not part of a revision: they are not restored with it.
 *
 * @property int $id
 * @property int $entry_id
 * @property int|null $user_id
 * @property string $title
 * @property string $slug
 * @property string|null $excerpt
 * @property list<array{id: string, type: string, data: array<string, mixed>}>|null $body
 * @property string|null $featured_image
 * @property string $status
 * @property Carbon|null $published_at
 * @property array<string, mixed>|null $custom_fields
 * @property array<string, mixed>|null $seo
 * @property Carbon $created_at
 */
class ContentEntryRevision extends Model
{
    // The most revisions kept for one entry. Older ones are removed when a new one is saved.
    public const KEEP = 50;

    public $timestamps = false;

    protected $table = 'cms_entry_revisions';

    protected $fillable = [
        'entry_id',
        'user_id',
        'title',
        'slug',
        'excerpt',
        'body',
        'featured_image',
        'status',
        'published_at',
        'custom_fields',
        'seo',
    ];

    protected $casts = [
        'body' => 'array',
        'custom_fields' => 'array',
        'seo' => 'array',
        'published_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<ContentEntry, $this>
     */
    public function entry(): BelongsTo
    {
        return $this->belongsTo(ContentEntry::class, 'entry_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The content of an entry as a revision stores it. Taken before a change, so the revision is the old version.
     *
     * @return array<string, mixed>
     */
    public static function snapshot(ContentEntry $entry): array
    {
        return [
            'title' => $entry->title,
            'slug' => $entry->slug,
            'excerpt' => $entry->excerpt,
            'body' => $entry->body ?? [],
            'featured_image' => $entry->featured_image,
            'status' => $entry->status,
            'published_at' => $entry->published_at,
            'custom_fields' => $entry->custom_fields ?? [],
            'seo' => $entry->seo ?? [],
        ];
    }

    /**
     * Saves a snapshot as a revision of the entry, then removes the oldest revisions beyond KEEP.
     *
     * @param  array<string, mixed>  $snapshot
     */
    public static function store(ContentEntry $entry, array $snapshot, ?int $userId): self
    {
        $revision = static::query()->create([
            ...$snapshot,
            'entry_id' => $entry->id,
            'user_id' => $userId,
            'created_at' => now(),
        ]);

        $stale = static::query()
            ->where('entry_id', $entry->id)
            ->orderByDesc('id')
            ->skip(self::KEEP)
            ->take(PHP_INT_MAX)
            ->pluck('id');

        if ($stale->isNotEmpty()) {
            static::query()->whereIn('id', $stale)->delete();
        }

        return $revision;
    }
}
