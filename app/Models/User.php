<?php

namespace App\Models;

use App\Settings\AppSettings;
use App\Support\Rbac;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property Carbon|null $suspended_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $timezone
 * @property string|null $locale
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'timezone', 'locale', 'date_of_birth', 'hidden_display_items', 'notification_settings', 'avatar_path', 'header_path', 'bio', 'job_title', 'company', 'location', 'website', 'sidebar_variant', 'font'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Attributes added to the array and JSON form of the model.
     *
     * @var list<string>
     */
    protected $appends = ['avatar_url', 'header_url'];

    /**
     * Public URL of the profile picture, or null when the user has none.
     *
     * @return Attribute<string|null, never>
     */
    protected function avatarUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->avatar_path
            ? Storage::disk('public')->url($this->avatar_path)
            : null);
    }

    /**
     * The public URL of the profile header image, or null when none is set.
     *
     * @return Attribute<string|null, never>
     */
    protected function headerUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->header_path
            ? Storage::disk('public')->url($this->header_path)
            : null);
    }

    /**
     * The tasks that belong to the user.
     *
     * @return HasMany<Task, $this>
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Give every new account the default role. Roles are found or created so this also works
     * before Rbac::sync() has run, for example in tests.
     */
    protected static function booted(): void
    {
        static::created(function (User $user): void {
            $user->assignRole(Role::findOrCreate(app(AppSettings::class)->default_role));
        });
    }

    /**
     * Whether an administrator has suspended the account. Suspended users cannot sign in.
     */
    public function isSuspended(): bool
    {
        return $this->suspended_at !== null;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'suspended_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'date_of_birth' => 'date',
            'hidden_display_items' => 'array',
            'notification_settings' => 'array',
        ];
    }
}
