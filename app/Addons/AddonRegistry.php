<?php

namespace App\Addons;

use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * The addons the app is running with, read from the compiled manifest. It never touches the database, so the
 * boot path and every web request stay as cheap as they were before addons existed.
 *
 * If the manifest is missing or unreadable, no addons are enabled and a warning is logged once per process.
 */
final class AddonRegistry
{
    public const STATUS_OK = 'ok';

    public const STATUS_MISSING = 'missing';

    public const STATUS_UNREADABLE = 'unreadable';

    /** @var array{status: string, checksum: ?string, addons: array<string, array<string, mixed>>}|null */
    private ?array $state = null;

    private bool $warned = false;

    public function reload(): void
    {
        $this->state = null;
    }

    /**
     * One of the STATUS_ constants.
     */
    public function status(): string
    {
        return $this->state()['status'];
    }

    public function stateChecksum(): ?string
    {
        return $this->state()['checksum'];
    }

    /**
     * Every installed addon, by slug, whether it is enabled or not.
     *
     * @return array<string, array<string, mixed>>
     */
    public function installed(): array
    {
        return $this->state()['addons'];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function entry(string $slug): ?array
    {
        return $this->installed()[$slug] ?? null;
    }

    /**
     * The enabled addons, by slug.
     *
     * @return array<string, array<string, mixed>>
     */
    public function active(): array
    {
        return array_filter($this->installed(), fn (array $entry): bool => ($entry['enabled'] ?? false) === true);
    }

    public function isInstalled(string $slug): bool
    {
        return isset($this->installed()[$slug]);
    }

    public function isActive(string $slug): bool
    {
        return ($this->installed()[$slug]['enabled'] ?? false) === true;
    }

    /**
     * The permissions declared by the enabled addons.
     *
     * @return list<string>
     */
    public function activePermissions(): array
    {
        $permissions = [];

        foreach ($this->active() as $entry) {
            foreach ((array) ($entry['permissions'] ?? []) as $permission) {
                $permissions[] = (string) $permission;
            }
        }

        return array_values(array_unique($permissions));
    }

    /**
     * @return array{status: string, checksum: ?string, addons: array<string, array<string, mixed>>}
     */
    private function state(): array
    {
        return $this->state ??= $this->load();
    }

    /**
     * @return array{status: string, checksum: ?string, addons: array<string, array<string, mixed>>}
     */
    private function load(): array
    {
        $path = (string) config('addons.manifest_path');

        if (! is_file($path)) {
            return $this->unavailable(self::STATUS_MISSING, "The compiled addon manifest was not found at {$path}. No addons are enabled. Run php artisan addons:compile.");
        }

        try {
            $data = require $path;
        } catch (Throwable $e) {
            return $this->unavailable(self::STATUS_UNREADABLE, "The compiled addon manifest at {$path} could not be read: {$e->getMessage()}. No addons are enabled.");
        }

        if (! is_array($data) || ! is_array($data['addons'] ?? null)) {
            return $this->unavailable(self::STATUS_UNREADABLE, "The compiled addon manifest at {$path} is malformed. No addons are enabled.");
        }

        return [
            'status' => self::STATUS_OK,
            'checksum' => is_string($data['state_checksum'] ?? null) ? $data['state_checksum'] : null,
            'addons' => $this->withDriftChecked($data['addons']),
        ];
    }

    /**
     * An enabled addon whose addon.json changed since the compile is switched off for this process. The file is not
     * read or run differently; it is only not trusted. One warning names every such addon. Nothing is thrown.
     *
     * @param  array<string, array<string, mixed>>  $addons
     * @return array<string, array<string, mixed>>
     */
    private function withDriftChecked(array $addons): array
    {
        $drifted = [];

        foreach ($addons as $slug => $entry) {
            $file = $entry['manifest_path'] ?? null;
            $checksum = $entry['checksum'] ?? null;

            if (($entry['enabled'] ?? false) !== true || ! is_string($file) || ! is_string($checksum) || ! is_file($file)) {
                continue;
            }

            if (hash_equals($checksum, hash('sha256', (string) file_get_contents($file)))) {
                continue;
            }

            $addons[$slug]['recorded'] = $entry;
            $addons[$slug]['enabled'] = false;
            $addons[$slug]['drifted'] = true;
            $drifted[] = (string) $slug;
        }

        if ($drifted !== []) {
            Log::warning('These addons changed on disk after they were installed, and are switched off until php artisan addons:update runs: '.implode(', ', $drifted).'.');
        }

        return $addons;
    }

    /**
     * @return array{status: string, checksum: ?string, addons: array<string, array<string, mixed>>}
     */
    private function unavailable(string $status, string $message): array
    {
        if (! $this->warned) {
            Log::warning($message);
            $this->warned = true;
        }

        return ['status' => $status, 'checksum' => null, 'addons' => []];
    }
}
