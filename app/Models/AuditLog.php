<?php

namespace App\Models;

use App\Http\Controllers\ImpersonationController;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;

/**
 * One recorded action in the admin area. Rows are only ever added.
 *
 * @property int $id
 * @property int|null $actor_id
 * @property int|null $impersonator_id
 * @property string $action
 * @property string|null $subject_type
 * @property int|null $subject_id
 * @property string|null $subject_label
 * @property array<string, mixed>|null $properties
 * @property string|null $ip_address
 * @property \Illuminate\Support\Carbon $created_at
 */
class AuditLog extends Model
{
    /** Rows never change, so there is no updated_at column. */
    public const UPDATED_AT = null;

    /** @var list<string> */
    protected $fillable = [
        'actor_id',
        'impersonator_id',
        'action',
        'subject_type',
        'subject_id',
        'subject_label',
        'properties',
        'ip_address',
    ];

    /**
     * Record an action. The actor is the signed-in user, and the impersonator is set
     * when an administrator is acting as another user.
     *
     * @param  array<string, mixed>  $properties
     */
    public static function record(string $action, ?User $subject = null, array $properties = [], ?Request $request = null): self
    {
        $request ??= request();
        $impersonatorId = $request->hasSession()
            ? $request->session()->get(ImpersonationController::SESSION_KEY)
            : null;

        return static::query()->create([
            'actor_id' => $request->user()?->id,
            'impersonator_id' => $impersonatorId,
            'action' => $action,
            'subject_type' => $subject ? User::class : null,
            'subject_id' => $subject?->id,
            'subject_label' => $subject?->email,
            'properties' => $properties === [] ? null : $properties,
            'ip_address' => $request->ip(),
        ]);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function impersonator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'impersonator_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'properties' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
