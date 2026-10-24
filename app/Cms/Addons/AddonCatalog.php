<?php

namespace App\Cms\Addons;

use App\Cms\Manifests\AddonManifest;
use App\Cms\Repositories\AddonRepository;
use Throwable;

/**
 * Read model for the addons screen.
 *
 * Three states a card can be in: installed (a database row decides), discovered
 * (a folder exists but was never installed) and blocked (the folder exists but
 * its `requires` constraints cannot be met). A blocked addon still shows up, so
 * the reason is visible instead of the addon silently missing.
 */
final class AddonCatalog
{
    public function __construct(private readonly AddonRepository $addons) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function cards(): array
    {
        $cards = [];
        $rows = $this->addons->installed();

        foreach ($rows as $row) {
            $manifest = null;

            try {
                $manifest = $this->addons->manifestFromRow($row);
            } catch (Throwable) {
                // A row whose manifest cannot be parsed is reported, not hidden.
            }

            $cards[strtolower((string) $row->handle)] = $this->card(
                handle: (string) $row->handle,
                name: (string) $row->name,
                version: (string) $row->version,
                description: $manifest?->description ?? '',
                author: $manifest?->author ?? '',
                status: (string) $row->status,
                manifest: $manifest,
                installed: true,
                error: $row->last_error,
                activatedAt: $row->activated_at,
                installedAt: $row->installed_at,
            );
        }

        foreach ($this->addons->discovered() as $manifest) {
            $key = strtolower($manifest->handle);

            if (isset($cards[$key])) {
                continue;
            }

            $requirements = $this->addons->satisfiesRequirements($manifest);

            $cards[$key] = $this->card(
                handle: $manifest->handle,
                name: $manifest->name,
                version: $manifest->version,
                description: $manifest->description,
                author: $manifest->author,
                status: $requirements['ok'] ? 'discovered' : 'blocked',
                manifest: $manifest,
                installed: false,
                error: $requirements['reason'],
                activatedAt: null,
                installedAt: null,
            );
        }

        ksort($cards);

        return array_values($cards);
    }

    /**
     * @return array<string, int>
     */
    public function counts(): array
    {
        $counts = ['all' => 0, 'active' => 0, 'inactive' => 0, 'discovered' => 0, 'error' => 0, 'blocked' => 0];

        foreach ($this->cards() as $card) {
            $counts['all']++;

            $status = (string) $card['status'];
            $counts[$status] = ($counts[$status] ?? 0) + 1;
        }

        return $counts;
    }

    /**
     * @return array<string, mixed>
     */
    private function card(
        string $handle,
        string $name,
        string $version,
        string $description,
        string $author,
        string $status,
        ?AddonManifest $manifest,
        bool $installed,
        ?string $error,
        ?string $activatedAt,
        ?string $installedAt,
    ): array {
        $canUninstall = $installed && $manifest !== null && $this->ownsFiles($manifest);

        return [
            'handle' => $handle,
            'name' => $name,
            'version' => $version,
            'description' => $description,
            'author' => $author,
            'status' => $status,
            'installed' => $installed,
            'can_uninstall' => $canUninstall,
            'error' => $error,
            'permissions' => $manifest?->permissions ?? [],
            'navigation' => $manifest?->navigation ?? [],
            'sections' => array_map(
                fn (array $section): string => (string) ($section['key'] ?? $section['class'] ?? 'section'),
                $manifest?->sections ?? [],
            ),
            'resources' => array_map(
                fn (array $resource): string => (string) ($resource['label'] ?? $resource['key'] ?? 'resource'),
                $manifest?->resources ?? [],
            ),
            'requires' => $manifest?->requires ?? [],
            'migrations' => $manifest?->migrations ?? false,
            'activated_at' => $activatedAt,
            'installed_at' => $installedAt,
            'urls' => [
                'install' => route('admin.addons.install', $handle),
                'activate' => route('admin.addons.activate', $handle),
                'deactivate' => route('admin.addons.deactivate', $handle),
                'uninstall' => route('admin.addons.uninstall', $handle),
            ],
        ];
    }

    /**
     * Only addons that live inside the configured addons folder may have their
     * files deleted — the same guard the manager applies before `deleteDirectory`.
     */
    private function ownsFiles(AddonManifest $manifest): bool
    {
        $base = realpath((string) config('lattice.paths.addons'));
        $path = realpath($manifest->path);

        return $base !== false && $path !== false && str_starts_with($path, $base.DIRECTORY_SEPARATOR);
    }
}
