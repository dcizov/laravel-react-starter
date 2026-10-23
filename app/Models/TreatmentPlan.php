<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $patient_id
 * @property string $title
 * @property string $focus
 * @property string $status
 * @property Carbon|null $start_date
 * @property Carbon|null $review_date
 * @property int $progress
 * @property array<int, array{title: string, completed: bool}>|null $goals
 * @property array<int, string>|null $interventions
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Patient|null $patient
 */
class TreatmentPlan extends Model
{
    protected $fillable = [
        'user_id', 'patient_id', 'title', 'focus', 'status', 'start_date',
        'review_date', 'progress', 'goals', 'interventions', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'review_date' => 'date',
            'goals' => 'array',
            'interventions' => 'array',
            'progress' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /** @return HasMany<TherapySession, $this> */
    public function sessions(): HasMany
    {
        return $this->hasMany(TherapySession::class);
    }
}
