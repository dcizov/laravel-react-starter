<?php

namespace App\Features\Integrations\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * A connected third-party tool. The credentials column holds every field value, encrypted.
 *
 * @property int $id
 * @property string $integration_key
 * @property array<string, string> $credentials
 * @property Carbon|null $connected_at
 */
class IntegrationConnection extends Model
{
    protected $table = 'integration_connections';

    protected $fillable = [
        'integration_key',
        'credentials',
        'connected_at',
    ];

    // Never serialise the credentials, even by accident.
    protected $hidden = [
        'credentials',
    ];

    protected function casts(): array
    {
        return [
            'credentials' => 'encrypted:array',
            'connected_at' => 'datetime',
        ];
    }
}
