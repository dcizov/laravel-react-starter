<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\Rbac;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Create an admin test account to sign in with, plus a few users with profiles.
     */
    public function run(): void
    {
        // Model events are muted while seeding, so the default role is assigned here.
        User::factory()
            ->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
            ])
            ->assignRole('admin');

        User::factory()
            ->withProfile()
            ->count(3)
            ->create()
            ->each(fn (User $user) => $user->assignRole(Rbac::DEFAULT_ROLE));
    }
}
