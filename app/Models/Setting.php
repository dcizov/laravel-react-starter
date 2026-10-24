<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A single site setting. Values are stored as JSON so a boolean, a number and a
 * string all round-trip without a second column, and `type` keeps the meaning
 * readable in the database.
 */
class Setting extends Model
{
    protected $fillable = ['key', 'group', 'type', 'value', 'is_public'];

    protected function casts(): array
    {
        return [
            'value' => 'json',
            'is_public' => 'boolean',
        ];
    }
}
