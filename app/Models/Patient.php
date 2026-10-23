<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $first_name
 * @property string $last_name
 * @property string|null $email
 * @property string|null $phone
 * @property Carbon|null $date_of_birth
 * @property string|null $pronouns
 * @property string $diagnoses
 * @property string $status
 * @property string $risk_level
 * @property string|null $notes
 * @property string|null $emergency_contact
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property int|null $sessions_count
 * @property string|null $latest_check_in
 * @property-read TreatmentPlan|null $activePlan
 * @property-read Collection<int, TreatmentPlan> $treatmentPlans
 * @property-read Collection<int, TherapySession> $sessions
 * @property-read Collection<int, CheckIn> $checkIns
 */
class Patient extends Model
{
    protected $fillable = [
        'user_id', 'first_name', 'last_name', 'email', 'phone',
        'date_of_birth', 'pronouns', 'diagnoses', 'status', 'risk_level',
        'notes', 'emergency_contact',
    ];

    protected function casts(): array
    {
        return ['date_of_birth' => 'date'];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<TreatmentPlan, $this> */
    public function treatmentPlans(): HasMany
    {
        return $this->hasMany(TreatmentPlan::class);
    }

    /** @return HasOne<TreatmentPlan, $this> */
    public function activePlan(): HasOne
    {
        return $this->hasOne(TreatmentPlan::class)->where('status', 'active')->latestOfMany();
    }

    /** @return HasMany<TherapySession, $this> */
    public function sessions(): HasMany
    {
        return $this->hasMany(TherapySession::class);
    }

    /** @return HasMany<CheckIn, $this> */
    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class);
    }
}
