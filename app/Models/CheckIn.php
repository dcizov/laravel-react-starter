<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $patient_id
 * @property Carbon|null $checked_in_on
 * @property int $mood
 * @property int $energy
 * @property int $focus
 * @property string|null $sleep_hours
 * @property string|null $note
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Patient|null $patient
 */
class CheckIn extends Model
{
    protected $fillable = [
        'user_id', 'patient_id', 'checked_in_on', 'mood', 'energy', 'focus',
        'sleep_hours', 'note',
    ];

    protected function casts(): array
    {
        return [
            'checked_in_on' => 'date',
            'mood' => 'integer',
            'energy' => 'integer',
            'focus' => 'integer',
            'sleep_hours' => 'decimal:1',
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
}
