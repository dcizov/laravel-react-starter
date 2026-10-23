<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $patient_id
 * @property int|null $treatment_plan_id
 * @property Carbon|null $scheduled_at
 * @property int $duration
 * @property string $type
 * @property string $status
 * @property string $location
 * @property int|null $mood_before
 * @property int|null $mood_after
 * @property string|null $notes
 * @property string|null $homework
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Patient|null $patient
 */
class TherapySession extends Model
{
    protected $table = 'therapy_sessions';

    protected $fillable = [
        'user_id', 'patient_id', 'treatment_plan_id', 'scheduled_at', 'duration',
        'type', 'status', 'location', 'mood_before', 'mood_after', 'notes', 'homework',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'duration' => 'integer',
            'mood_before' => 'integer',
            'mood_after' => 'integer',
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

    /** @return BelongsTo<TreatmentPlan, $this> */
    public function treatmentPlan(): BelongsTo
    {
        return $this->belongsTo(TreatmentPlan::class);
    }
}
