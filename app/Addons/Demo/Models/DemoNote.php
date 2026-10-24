<?php

declare(strict_types=1);

namespace App\Addons\Demo\Models;

use Illuminate\Database\Eloquent\Model;

class DemoNote extends Model
{
    protected $table = 'demo_notes';

    protected $fillable = ['body'];
}
