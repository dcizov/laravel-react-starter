<?php

namespace App\Features\Blog\Models;

use App\Features\Cms\Models\ContentEntry;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A visitor's comment on a post. Visitors only see approved comments.
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
    public const PENDING = 'pending';

    public const APPROVED = 'approved';

    public const SPAM = 'spam';

    /** @var list<string> */
    public const STATUSES = [self::PENDING, self::APPROVED, self::SPAM];

    protected $table = 'blog_comments';

    protected $fillable = [
        'entry_id',
        'author_name',
        'author_email',
        'body',
        'status',
    ];

    public function scopeApproved(Builder $query): void
    {
        $query->where('status', self::APPROVED);
    }

    public function entry(): BelongsTo
    {
        return $this->belongsTo(ContentEntry::class, 'entry_id');
    }
}
