<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\Rbac;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Create an admin test account to sign in with, plus a few users with profiles.
     *
     * These accounts use a public password, so they are only created locally and in tests.
     * Running the seeder again does not create duplicates.
     */
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        // Model events are muted while seeding, so the default role is assigned here.
        $testUser = User::query()->where('email', 'test@example.com')->first()
            ?? User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $testUser->assignRole('admin');

        if (User::query()->whereKeyNot($testUser->getKey())->exists()) {
            return;
        }

        User::factory()
            ->withProfile()
            ->count(3)
            ->create()
            ->each(fn (User $user) => $user->assignRole(Rbac::DEFAULT_ROLE));
    }
}
