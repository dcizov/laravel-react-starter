<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database with example users and tasks.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            TaskSeeder::class,
        ]);
    }
}
