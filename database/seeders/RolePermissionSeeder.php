<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Cms\Repositories\AddonRepository;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Turns the role matrix in `config/lattice.php` into roles and permissions.
 * Also registers the permissions declared by installed addon manifests.
 */
class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $matrix = (array) config('lattice.roles', []);

        $permissions = collect($matrix)
            ->flatMap(fn (array $abilities): array => $abilities)
            ->reject(fn (string $ability): bool => $ability === '*')
            ->merge((array) config('lattice.admin_only_abilities', []))
            ->merge($this->addonPermissions())
            ->unique()
            ->sort()
            ->values();

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        foreach ($matrix as $roleName => $abilities) {
            $role = Role::findOrCreate($roleName, 'web');

            if (in_array('*', $abilities, true)) {
                $role->syncPermissions(Permission::all());
            } else {
                $role->syncPermissions($abilities);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * @return list<string>
     */
    private function addonPermissions(): array
    {
        $permissions = [];

        foreach (app(AddonRepository::class)->installed() as $row) {
            $manifest = json_decode((string) $row->manifest, true) ?: [];

            foreach ((array) ($manifest['permissions'] ?? []) as $permission) {
                if (is_string($permission)) {
                    $permissions[] = $permission;
                }
            }
        }

        return $permissions;
    }
}
