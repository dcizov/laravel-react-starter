<?php

namespace App\Models;

use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property string $code
 * @property string $title
 * @property string $status
 * @property string $label
 * @property string $priority
 */
#[Fillable(['user_id', 'code', 'title', 'status', 'label', 'priority'])]
class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    /**
     * The values a task can have. The Tasks page shows the same options.
     */
    public const STATUSES = ['backlog', 'todo', 'in progress', 'done', 'canceled'];

    public const LABELS = ['bug', 'feature', 'documentation'];

    public const PRIORITIES = ['low', 'medium', 'high'];

    /**
     * A task code that no other task uses, such as TASK-4821.
     */
    public static function newCode(): string
    {
        do {
            $code = 'TASK-'.random_int(1000, 9999);
        } while (self::query()->where('code', $code)->exists());

        return $code;
    }

    /**
     * The user who owns the task.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
