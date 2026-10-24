<?php

namespace Database\Seeders;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * The minimum a fresh install needs: roles, permissions and the first
     * administrator. Demo content arrives in the demo seeder.
     */
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);
        $this->call(MenuSeeder::class);

        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@lattice.test'],
            [
                'name' => 'Avery Quinn',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        if (! $admin->hasRole('Admin')) {
            $admin->assignRole('Admin');
        }

        $editor = User::query()->firstOrCreate(
            ['email' => 'editor@lattice.test'],
            [
                'name' => 'Mira Lindqvist',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        if (! $editor->hasRole('Editor')) {
            $editor->assignRole('Editor');
        }

        $author = User::query()->firstOrCreate(
            ['email' => 'author@lattice.test'],
            [
                'name' => 'Tobias Berg',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        if (! $author->hasRole('Author')) {
            $author->assignRole('Author');
        }

        if (! Invitation::query()->where('email', 'pending@lattice.test')->exists()) {
            Invitation::createFor('pending@lattice.test', 'Editor', $admin);
        }
    }
}
