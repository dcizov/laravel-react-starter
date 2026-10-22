<?php

namespace App\Features\Cms\Models;

use App\Features\Cms\Factories\CommentFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A visitor's comment on an entry whose type has the comments support. Visitors only see approved comments.
 *
 * @property int $id
 * @property int $entry_id
 * @property string $author_name
 * @property string|null $author_email
 * @property string $body
 * @property string $status
 */
class Comment extends Model
{
    /** @use HasFactory<CommentFactory> */
    use HasFactory;

    public const PENDING = 'pending';

    public const APPROVED = 'approved';

    public const SPAM = 'spam';

    /** @var list<string> */
    public const STATUSES = [self::PENDING, self::APPROVED, self::SPAM];

    protected $table = 'cms_comments';

    protected $fillable = [
        'entry_id',
        'author_name',
        'author_email',
        'body',
        'status',
    ];

    /**
     * @param  Builder<static>  $query
     */
    public function scopeApproved(Builder $query): void
    {
        $query->where('status', self::APPROVED);
    }

    /**
     * @return BelongsTo<ContentEntry, $this>
     */
    public function entry(): BelongsTo
    {
        return $this->belongsTo(ContentEntry::class, 'entry_id');
    }

    protected static function newFactory(): CommentFactory
    {
        return CommentFactory::new();
    }
}
