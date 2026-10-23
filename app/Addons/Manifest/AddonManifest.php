<?php

namespace App\Addons\Manifest;

/**
 * An addon.json that has passed validation. Its paths are absolute, so the rest of the system never has to
 * work out where an addon lives.
 */
final readonly class AddonManifest
{
    /**
     * @param  array<string, string>  $requires  Addon slug => version constraint.
     * @param  list<string>  $permissions
     * @param  list<string>  $tables
     * @param  list<array{page: string, layout: string, url?: string}>  $pages  From provides.pages. Empty when the addon has none.
     */
    public function __construct(
        public string $name,
        public string $slug,
        public string $version,
        public string $label,
        public string $core,
        public string $directory,
        public string $checksum,
        public array $requires,
        public ?string $provider,
        public ?string $routes,
        public array $permissions,
        public ?string $migrations,
        public array $tables,
        public ?string $config,
        public ?string $translations,
        public string $routesMount = 'addon',
        public array $pages = [],
    ) {}

    /**
     * @param  array<string, mixed>  $data  A manifest that has passed ManifestValidator.
     */
    public static function fromValidated(array $data, string $directory, string $checksum): self
    {
        $directory = rtrim($directory, '/');
        $provides = is_array($data['provides'] ?? null) ? $data['provides'] : [];
        $requires = is_array($data['requires']['addons'] ?? null) ? $data['requires']['addons'] : [];

        $path = static fn (string $key): ?string => isset($provides[$key]) && is_string($provides[$key])
            ? $directory.'/'.$provides[$key]
            : null;

        return new self(
            name: (string) $data['name'],
            slug: (string) $data['slug'],
            version: (string) $data['version'],
            label: (string) $data['label'],
            core: (string) $data['core'],
            directory: $directory,
            checksum: $checksum,
            requires: array_map('strval', $requires),
            provider: isset($data['provider']) ? (string) $data['provider'] : null,
            routes: $path('routes'),
            permissions: array_values(array_map('strval', (array) ($provides['permissions'] ?? []))),
            migrations: $path('migrations'),
            tables: array_values(array_map('strval', (array) ($provides['tables'] ?? []))),
            config: $path('config'),
            translations: $path('translations'),
            routesMount: ($provides['routes_mount'] ?? 'addon') === 'root' ? 'root' : 'addon',
            pages: array_values(array_map(
                static fn (array $entry): array => [
                    'page' => (string) $entry['page'],
                    'layout' => (string) $entry['layout'],
                    ...(array_key_exists('url', $entry) ? ['url' => (string) $entry['url']] : []),
                ],
                array_filter(is_array($provides['pages'] ?? null) ? $provides['pages'] : [], is_array(...)),
            )),
        );
    }

    public function manifestPath(): string
    {
        return $this->directory.'/addon.json';
    }

    /**
     * The form stored in the compiled manifest.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'slug' => $this->slug,
            'version' => $this->version,
            'label' => $this->label,
            'core' => $this->core,
            'directory' => $this->directory,
            'manifest_path' => $this->manifestPath(),
            'checksum' => $this->checksum,
            'requires' => $this->requires,
            'provider' => $this->provider,
            'routes' => $this->routes,
            'permissions' => $this->permissions,
            'migrations' => $this->migrations,
            'tables' => $this->tables,
            'config' => $this->config,
            'translations' => $this->translations,
            'routes_mount' => $this->routesMount,
            'pages' => $this->pages,
        ];
    }
}
