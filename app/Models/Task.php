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
     * The user who owns the task.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
