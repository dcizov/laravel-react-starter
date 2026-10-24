<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $email
 * @property string $role
 * @property string $token
 * @property int|null $invited_by
 * @property Carbon $expires_at
 * @property Carbon|null $accepted_at
 */
class Invitation extends Model
{
    protected $fillable = ['email', 'role', 'token', 'invited_by', 'expires_at', 'accepted_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    /**
     * Invitations are stored hashed, exactly like password reset tokens.
     */
    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    public static function findByToken(string $token): ?self
    {
        return static::query()->where('token', self::hashToken($token))->first();
    }

    /**
     * @return array{invitation: self, token: string}
     */
    public static function createFor(string $email, string $role, ?User $inviter): array
    {
        $token = Str::random(48);

        $invitation = static::query()->create([
            'email' => $email,
            'role' => $role,
            'token' => self::hashToken($token),
            'invited_by' => $inviter?->id,
            'expires_at' => now()->addDays(7),
        ]);

        return ['invitation' => $invitation, 'token' => $token];
    }

    public function isPending(): bool
    {
        return $this->accepted_at === null && $this->expires_at->isFuture();
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }
}
