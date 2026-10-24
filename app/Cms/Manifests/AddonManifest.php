<?php

declare(strict_types=1);

namespace App\Cms\Manifests;

use Illuminate\Contracts\Support\Arrayable;

/**
 * Immutable description of an addon, loaded from its `addon.json`.
 *
 * The manifest stored in the database always wins over the file on disk:
 * once an addon is installed, editing its folder must not silently change
 * what the application requires in order to boot.
 *
 * @implements Arrayable<string, mixed>
 */
final class AddonManifest implements Arrayable
{
    /**
     * @param  array<string, mixed>  $requires
     * @param  list<string>  $permissions
     * @param  list<array<string, mixed>>  $navigation
     * @param  list<string>  $seeders
     * @param  array<string, mixed>  $settings
     * @param  list<array<string, mixed>>  $resources
     * @param  list<array<string, mixed>>  $sections
     */
    public function __construct(
        public readonly string $handle,
        public readonly string $name,
        public readonly string $version,
        public readonly string $provider,
        public readonly string $path,
        public readonly string $description = '',
        public readonly string $author = '',
        public readonly array $requires = [],
        public readonly array $permissions = [],
        public readonly array $navigation = [],
        public readonly array $seeders = [],
        public readonly array $settings = [],
        public readonly array $resources = [],
        public readonly array $sections = [],
        public readonly bool $migrations = true,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data, string $path): self
    {
        return new self(
            handle: (string) ($data['handle'] ?? basename($path)),
            name: (string) ($data['name'] ?? $data['handle'] ?? basename($path)),
            version: (string) ($data['version'] ?? '0.0.0'),
            provider: (string) ($data['provider'] ?? ''),
            path: $path,
            description: (string) ($data['description'] ?? ''),
            author: (string) ($data['author'] ?? ''),
            requires: (array) ($data['requires'] ?? []),
            permissions: array_values((array) ($data['permissions'] ?? [])),
            navigation: array_values((array) ($data['navigation'] ?? [])),
            seeders: array_values((array) ($data['seeders'] ?? [])),
            settings: (array) ($data['settings'] ?? []),
            resources: array_values((array) ($data['resources'] ?? [])),
            sections: array_values((array) ($data['sections'] ?? [])),
            migrations: (bool) ($data['migrations'] ?? true),
        );
    }

    /**
     * Read `addon.json` from an addon folder.
     */
    public static function fromPath(string $path): self
    {
        $file = rtrim($path, '/').'/addon.json';

        if (! is_file($file)) {
            throw new \RuntimeException("Missing addon.json in [{$path}].");
        }

        $decoded = json_decode((string) file_get_contents($file), true);

        if (! is_array($decoded)) {
            throw new \RuntimeException("addon.json in [{$path}] is not valid JSON.");
        }

        return self::fromArray($decoded, rtrim($path, '/'));
    }

    /**
     * Dependencies on other addons as `handle => constraint`.
     *
     * @return array<string, string>
     */
    public function addonRequirements(): array
    {
        return (array) ($this->requires['addons'] ?? []);
    }

    public function constraint(string $key): ?string
    {
        $value = $this->requires[$key] ?? null;

        return is_string($value) ? $value : null;
    }

    public function migrationPath(): string
    {
        return $this->path.'/database/migrations';
    }

    public function routePath(string $name): string
    {
        return $this->path.'/routes/'.$name.'.php';
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'handle' => $this->handle,
            'name' => $this->name,
            'version' => $this->version,
            'description' => $this->description,
            'author' => $this->author,
            'provider' => $this->provider,
            'requires' => $this->requires,
            'permissions' => $this->permissions,
            'navigation' => $this->navigation,
            'seeders' => $this->seeders,
            'settings' => $this->settings,
            'resources' => $this->resources,
            'sections' => $this->sections,
            'migrations' => $this->migrations,
        ];
    }
}
