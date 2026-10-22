<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * One migration of an addon that has run. Used to decide which migrations still need to run, so a failed
 * activation can be retried without running the finished ones again.
 *
 * @property int $id
 * @property string $addon_slug
 * @property string $migration
 * @property int $batch
 * @property Carbon $applied_at
 */
class AddonMigration extends Model
{
    public $timestamps = false;

    /** @var list<string> */
    protected $fillable = [
        'addon_slug',
        'migration',
        'batch',
        'applied_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'batch' => 'integer',
            'applied_at' => 'datetime',
        ];
    }
}
