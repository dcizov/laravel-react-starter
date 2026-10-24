<?php

declare(strict_types=1);

namespace App\Cms\Repositories;

use App\Cms\Manifests\ThemeManifest;
use App\Cms\Support\VersionConstraint;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Reads and writes the `themes` table using the query builder only, so the
 * repository is safe to call from `ProviderLoader::register()`.
 */
final class ThemeRepository
{
    public function __construct(private readonly Application $app) {}

    public function install(ThemeManifest $manifest): void
    {
        $this->table()->updateOrInsert(
            ['handle' => $manifest->handle],
            [
                'name' => $manifest->name,
                'version' => $manifest->version,
                'provider' => $manifest->provider,
                'manifest' => json_encode($manifest->toArray(), JSON_THROW_ON_ERROR),
                'path' => $this->relativePath($manifest->path),
                'last_error' => null,
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

    public function active(): ?object
    {
        return $this->table()->where('is_active', true)->first();
    }

    /**
     * The active theme manifest, cached by handle and re-queried afterwards.
     */
    public function activeManifest(): ?ThemeManifest
    {
        $handle = $this->rememberActiveHandle();

        if ($handle === null) {
            return null;
        }

        $row = $this->table()->where('handle', $handle)->where('is_active', true)->first();

        return $row === null ? null : $this->manifestFromRow($row);
    }

    public function activate(string $handle): void
    {
        $this->table()->where('is_active', true)->update(['is_active' => false, 'updated_at' => now()]);
        $this->table()->where('handle', $handle)->update(['is_active' => true, 'last_error' => null, 'updated_at' => now()]);

        $this->flushCache();
    }

    public function deactivateAll(): void
    {
        $this->table()->where('is_active', true)->update(['is_active' => false, 'updated_at' => now()]);

        $this->flushCache();
    }

    public function markError(string $handle, string $message): void
    {
        $this->table()->where('handle', $handle)->update([
            'last_error' => mb_substr($message, 0, 1000),
            'updated_at' => now(),
        ]);

        $this->flushCache();
    }

    public function manifestFromRow(object $row): ThemeManifest
    {
        $data = json_decode((string) $row->manifest, true) ?: [];
        $path = (string) ($row->path ?? '');

        return ThemeManifest::fromArray($data, str_starts_with($path, '/') ? $path : base_path($path));
    }

    /**
     * Themes that exist on disk, keyed by handle.
     *
     * @return array<string, ThemeManifest>
     */
    public function discovered(): array
    {
        $path = (string) config('lattice.paths.themes');
        $manifests = [];

        foreach (glob($path.'/*', GLOB_ONLYDIR) ?: [] as $directory) {
            if (! is_file($directory.'/theme.json')) {
                continue;
            }

            try {
                $manifest = ThemeManifest::fromPath($directory);
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
    public function satisfiesRequirements(ThemeManifest $manifest): array
    {
        $checks = [
            'php' => PHP_VERSION,
            'laravel' => $this->app->version(),
            'lattice' => (string) config('lattice.version'),
        ];

        foreach ($checks as $key => $current) {
            $constraint = $manifest->constraint($key);

            if ($constraint !== null && ! VersionConstraint::satisfies($current, $constraint)) {
                return ['ok' => false, 'reason' => sprintf('Requires %s %s, this install is %s.', $key, $constraint, $current)];
            }
        }

        return ['ok' => true, 'reason' => null];
    }

    public function flushCache(): void
    {
        if (! $this->app->bound('cache')) {
            return;
        }

        $this->app->make('cache')->forget((string) config('lattice.cache.keys.themes'));
    }

    private function rememberActiveHandle(): ?string
    {
        $resolver = fn (): ?string => $this->table()->where('is_active', true)->value('handle');

        if (! $this->app->bound('cache')) {
            return $resolver();
        }

        $handle = $this->app->make('cache')->remember(
            (string) config('lattice.cache.keys.themes'),
            (int) config('lattice.cache.ttl'),
            $resolver,
        );

        return is_string($handle) ? $handle : null;
    }

    private function table(): Builder
    {
        return DB::connection()->table('themes');
    }

    private function relativePath(string $path): string
    {
        return str_replace(base_path().'/', '', $path);
    }
}
