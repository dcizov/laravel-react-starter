<?php

namespace Database\Seeders;

use App\Support\Rbac;
use Illuminate\Database\Seeder;

class RbacSeeder extends Seeder
{
    /**
     * Create the roles and permissions. Run it again after changing App\Support\Rbac.
     */
    public function run(): void
    {
        Rbac::sync();
    }
}
