<?php

declare(strict_types=1);

namespace App\Addons\Demo;

use Illuminate\Support\Facades\DB;

/**
 * Optional lifecycle hooks. A missing method is simply not called.
 */
class Activator
{
    public function activate(): void
    {
        // Proof that migrations ran before the hook: the table must exist.
        DB::table('demo_notes')->insert([
            'body' => 'Demo addon activated.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
