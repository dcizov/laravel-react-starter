<?php

namespace App\Addons;

use App\Addons\Discovery\AddonDiscovery;
use App\Addons\Events\AddonManifestCompiling;
use App\Addons\Exceptions\AddonException;
use App\Models\Addon;

/**
 * Writes the compiled manifest the app reads at boot, from the lifecycle state in the database and the addon
 * folders on disk. Refuses to compile an addon whose folder changed after it was installed.
 */
final class AddonCompiler
{
    public function __construct(
        private readonly AddonDiscovery $discovery,
        private readonly AddonRegistry $registry,
    ) {}

    /**
     * @return array<string, mixed> The payload written to the manifest.
     *
     * @throws AddonException
     */
    public function compile(): array
    {
        $rows = AddonStore::rows();
        $addons = [];

        foreach ($rows as $row) {
            $addons[$row->slug] = $this->entryFor($row);
        }

        $payload = [
            'format' => 1,
            'generated_at' => now()->toIso8601String(),
            'state_checksum' => AddonStore::stateChecksum($rows),
            'addons' => $addons,
        ];

        event(new AddonManifestCompiling($payload));

        $this->replace((string) config('addons.manifest_path'), $this->render($payload));
        $this->registry->reload();

        return $payload;
    }

    /**
     * Keep a copy of the current manifest, so it can be restored if the next operation fails.
     */
    public function snapshot(): void
    {
        $manifest = (string) config('addons.manifest_path');
        $lastGood = (string) config('addons.last_good_path');

        if (is_file($manifest)) {
            $this->replace($lastGood, (string) file_get_contents($manifest));

            return;
        }

        if (is_file($lastGood)) {
            unlink($lastGood);
        }
    }

    /**
     * Put back the manifest kept by snapshot(). With no copy, the manifest did not exist before the operation, so
     * remove the one it wrote. Without a manifest the registry enables no addons, so the state stays fail-closed.
     */
    public function restore(): void
    {
        $manifest = (string) config('addons.manifest_path');
        $lastGood = (string) config('addons.last_good_path');

        if (is_file($lastGood)) {
            $this->replace($manifest, (string) file_get_contents($lastGood));
        } elseif (is_file($manifest)) {
            unlink($manifest);
        }

        $this->registry->reload();
    }

    /**
     * What is wrong with the compiled state, without changing anything. Empty when everything is in order.
     *
     * @return list<string>
     */
    public function problems(): array
    {
        // The registry memoizes the manifest it read. Read it again, so the check sees what is on disk now.
        $this->registry->reload();

        $rows = AddonStore::rows();
        $status = $this->registry->status();

        if ($status === AddonRegistry::STATUS_MISSING && $rows->isEmpty()) {
            return [];
        }

        if ($status === AddonRegistry::STATUS_MISSING) {
            return ['The compiled manifest is missing. Run php artisan addons:compile.'];
        }

        if ($status !== AddonRegistry::STATUS_OK) {
            return ['The compiled manifest is unreadable. Run php artisan addons:compile.'];
        }

        $problems = [];

        if ($this->registry->stateChecksum() !== AddonStore::stateChecksum($rows)) {
            $problems[] = 'The compiled manifest is out of date with the database. Run php artisan addons:compile.';
        }

        foreach ($rows as $row) {
            $file = $row->path.'/addon.json';

            if (! is_file($file)) {
                $problems[] = "[{$row->slug}] is missing from disk at {$row->path}.";
            } elseif (! hash_equals($row->manifest_checksum, hash('sha256', (string) file_get_contents($file)))) {
                $problems[] = "[{$row->slug}] has an addon.json that changed on disk after it was installed.";
            }
        }

        return $problems;
    }

    /**
     * @return array<string, mixed>
     */
    private function entryFor(Addon $row): array
    {
        $file = $row->path.'/addon.json';

        if (! is_file($file)) {
            // The folder was removed. Keep the record, so the addon can still be deactivated, but never enable it.
            return [
                'name' => $row->name,
                'slug' => $row->slug,
                'version' => $row->version,
                'label' => $row->name,
                'core' => null,
                'directory' => $row->path,
                'manifest_path' => $file,
                'checksum' => $row->manifest_checksum,
                'requires' => [],
                'provider' => null,
                'routes' => null,
                'permissions' => [],
                'migrations' => null,
                'tables' => [],
                'config' => null,
                'translations' => null,
                'routes_mount' => 'addon',
                'status' => $row->status,
                'enabled' => false,
                'missing' => true,
            ];
        }

        $manifest = $this->discovery->readManifest($file, $row->manifest_checksum);

        return [
            ...$manifest->toArray(),
            'status' => $row->status,
            'enabled' => (bool) $row->enabled && $row->status === Addon::STATUS_ACTIVE,
            'missing' => false,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function render(array $payload): string
    {
        return "<?php\n\n// Generated by php artisan addons:compile. Do not edit by hand.\n\nreturn ".var_export($payload, true).";\n";
    }

    /**
     * Write to a temporary file and rename it over the target. A reader sees the old file or the new one, never half of each.
     */
    private function replace(string $path, string $contents): void
    {
        $directory = dirname($path);

        if (! is_dir($directory) && ! mkdir($directory, 0775, true) && ! is_dir($directory)) {
            throw new AddonException("Could not create the folder {$directory}.");
        }

        $temporary = $path.'.'.bin2hex(random_bytes(6)).'.tmp';

        if (file_put_contents($temporary, $contents, LOCK_EX) === false) {
            throw new AddonException("Could not write {$temporary}.");
        }

        if (! rename($temporary, $path)) {
            @unlink($temporary);

            throw new AddonException("Could not replace {$path}.");
        }
    }
}
