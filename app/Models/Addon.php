<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * An addon that has been installed. Its status says where it is in its lifecycle. The row is kept when the
 * addon is deactivated, so its data and history stay in place.
 *
 * @property int $id
 * @property string $slug
 * @property string $name
 * @property string $version
 * @property string $status
 * @property bool $enabled
 * @property string $path
 * @property string $manifest_checksum
 * @property string|null $last_error
 * @property \Illuminate\Support\Carbon|null $installed_at
 * @property \Illuminate\Support\Carbon|null $activated_at
 * @property \Illuminate\Support\Carbon|null $deactivated_at
 */
class Addon extends Model
{
    /** Installed, its code is registered, but it has not been activated. */
    public const STATUS_INSTALLED = 'installed';

    /** Activated: its migrations have run, its permissions are synced, and it is enabled. */
    public const STATUS_ACTIVE = 'active';

    /** Deactivated: switched off, with its code, tables and data kept. */
    public const STATUS_INACTIVE = 'inactive';

    /** The last activation failed. Its error is in last_error, and it is switched off. */
    public const STATUS_FAILED = 'failed';

    /** @var list<string> */
    public const STATUSES = [
        self::STATUS_INSTALLED,
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
        self::STATUS_FAILED,
    ];

    /** @var list<string> */
    protected $fillable = [
        'slug',
        'name',
        'version',
        'status',
        'enabled',
        'path',
        'manifest_checksum',
        'last_error',
        'installed_at',
        'activated_at',
        'deactivated_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'installed_at' => 'datetime',
            'activated_at' => 'datetime',
            'deactivated_at' => 'datetime',
        ];
    }
}
