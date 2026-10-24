<?php

namespace App\Cms\Repositories;

use App\Cms\Manifests\AddonManifest;
use App\Cms\Support\VersionConstraint;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use stdClass;

/**
 * Reads and writes the `addons` table.
 *
 * Everything here uses the query builder on purpose: the addon list is read
 * from `ProviderLoader::register()`, which runs before Eloquent's connection
 * resolver is available.
 */
final class AddonRepository
{
    public function __construct(private readonly Application $app) {}

    public function install(AddonManifest $manifest): void
    {
        $this->table()->updateOrInsert(
            ['handle' => $manifest->handle],
            [
                'name' => $manifest->name,
                'version' => $manifest->version,
                'provider' => $manifest->provider,
                'manifest' => json_encode($manifest->toArray(), JSON_THROW_ON_ERROR),
                'status' => 'inactive',
                'last_error' => null,
                'path' => $this->relativePath($manifest->path),
                'installed_at' => now(),
                'updated_at' => now(),
            ],
        );

        $this->flushCache();
    }

    /**
     * @return list<object>
     */
    public function installed(): array
    {
        return $this->table()->orderBy('name')->get()->all();
    }

    public function find(string $handle): ?object
    {
        return $this->table()->where('handle', $handle)->first();
    }

    /**
     * Active addon manifests, cached as handles only and re-queried afterwards.
     *
     * @return list<AddonManifest>
     */
    public function activeManifests(): array
    {
        $handles = $this->remember('addons', fn (): array => $this->table()
            ->where('status', 'active')
            ->orderBy('id')
            ->pluck('handle')
            ->all());

        if ($handles === []) {
            return [];
        }

        $rows = $this->table()->whereIn('handle', $handles)->orderBy('id')->get();

        $manifests = [];

        foreach ($rows as $row) {
            if ($row->status !== 'active') {
                continue;
            }

            $manifests[] = $this->manifestFromRow($row);
        }

        return $manifests;
    }

    public function manifestFromRow(object $row): AddonManifest
    {
        $data = json_decode((string) $row->manifest, true) ?: [];

        return AddonManifest::fromArray($data, $this->absolutePath((string) ($row->path ?? '')));
    }

    public function setStatus(string $handle, string $status, ?string $error = null): void
    {
        $values = [
            'status' => $status,
            'last_error' => $status === 'error' ? $error : null,
            'updated_at' => now(),
        ];

        if ($status === 'active') {
            $values['activated_at'] = now();
        }

        $this->table()->where('handle', $handle)->update($values);

        $this->flushCache();
    }

    public function markError(string $handle, string $message): void
    {
        $this->table()->where('handle', $handle)->update([
            'status' => 'error',
            'last_error' => mb_substr($message, 0, 1000),
            'updated_at' => now(),
        ]);

        $this->flushCache();
    }

    public function delete(string $handle): void
    {
        $this->table()->where('handle', $handle)->delete();

        $this->flushCache();
    }

    /**
     * Addons that exist on disk, keyed by handle.
     *
     * @return array<string, AddonManifest>
     */
    public function discovered(): array
    {
        $path = (string) config('lattice.paths.addons');
        $manifests = [];

        foreach (glob($path.'/*', GLOB_ONLYDIR) ?: [] as $directory) {
            if (! is_file($directory.'/addon.json')) {
                continue;
            }

            try {
                $manifest = AddonManifest::fromPath($directory);
            } catch (\Throwable) {
                continue;
            }

            $manifests[$manifest->handle] = $manifest;
        }

        return $manifests;
    }

    /**
     * @return array{ok: bool, reason: string|null}
     */
    public function satisfiesRequirements(AddonManifest $manifest): array
    {
        $checks = [
            'php' => PHP_VERSION,
            'laravel' => $this->app->version(),
            'lattice' => (string) config('lattice.version'),
        ];

        foreach ($checks as $key => $current) {
            $constraint = $manifest->constraint($key);

            if ($constraint !== null && ! VersionConstraint::satisfies($current, $constraint)) {
                return [
                    'ok' => false,
                    'reason' => sprintf(
                        'Requires %s %s, this install is %s.',
                        $key,
                        $constraint,
                        $current,
                    ),
                ];
            }
        }

        foreach ($manifest->addonRequirements() as $handle => $constraint) {
            $row = $this->find($handle);

            if ($row === null || $row->status !== 'active') {
                return ['ok' => false, 'reason' => "Requires the [{$handle}] addon to be active."];
            }

            if (! VersionConstraint::satisfies((string) $row->version, $constraint)) {
                return [
                    'ok' => false,
                    'reason' => sprintf('[%s] %s is active, %s required.', $handle, $row->version, $constraint),
                ];
            }
        }

        return ['ok' => true, 'reason' => null];
    }

    public function flushCache(): void
    {
        if (! $this->app->bound('cache')) {
            return;
        }

        $this->app->make('cache')->forget((string) config('lattice.cache.keys.addons'));
    }

    /**
     * @param  callable(): list<string>  $resolver
     * @return list<string>
     */
    private function remember(string $key, callable $resolver): array
    {
        if (! $this->app->bound('cache')) {
            return $resolver();
        }

        $cache = $this->app->make('cache');

        return array_values((array) $cache->remember(
            (string) config("lattice.cache.keys.{$key}"),
            (int) config('lattice.cache.ttl'),
            $resolver,
        ));
    }

    private function table(): Builder
    {
        return DB::connection()->table('addons');
    }

    private function relativePath(string $path): string
    {
        return str_replace(base_path().'/', '', $path);
    }

    private function absolutePath(string $path): string
    {
        return str_starts_with($path, '/') ? $path : base_path($path);
    }

    /**
     * @return list<AddonManifest>
     */
    public function all(): array
    {
        return array_map(fn (object $row): AddonManifest => $this->manifestFromRow($row), $this->installed());
    }

    /**
     * @return array<string, mixed>|null
     */
    public function rawRow(string $handle): ?array
    {
        $row = $this->find($handle);

        return $row === null ? null : (array) $row;
    }

    public function count(?string $status = null): int
    {
        $query = $this->table();

        if ($status !== null) {
            $query->where('status', $status);
        }

        return (int) $query->count();
    }

    public function rowToArray(stdClass $row): array
    {
        return (array) $row;
    }
}
