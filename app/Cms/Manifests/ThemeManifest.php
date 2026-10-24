<?php

declare(strict_types=1);

namespace App\Cms\Manifests;

use Illuminate\Contracts\Support\Arrayable;

/**
 * Immutable description of a theme, loaded from its `theme.json`.
 *
 * @implements Arrayable<string, mixed>
 */
final class ThemeManifest implements Arrayable
{
    /**
     * @param  array<string, mixed>  $requires
     * @param  array<string, mixed>  $tokens
     * @param  array<string, string>  $components
     */
    public function __construct(
        public readonly string $handle,
        public readonly string $name,
        public readonly string $version,
        public readonly string $provider,
        public readonly string $path,
        public readonly string $description = '',
        public readonly string $screenshot = '',
        public readonly array $requires = [],
        public readonly array $tokens = [],
        public readonly array $components = [],
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
            screenshot: (string) ($data['screenshot'] ?? ''),
            requires: (array) ($data['requires'] ?? []),
            tokens: (array) ($data['tokens'] ?? []),
            components: array_filter(
                array_map(
                    fn (mixed $component): string => is_string($component) ? $component : '',
                    (array) ($data['components'] ?? []),
                ),
                fn (string $component): bool => $component !== '',
            ),
        );
    }

    /**
     * Read `theme.json` from a theme folder.
     */
    public static function fromPath(string $path): self
    {
        $file = rtrim($path, '/').'/theme.json';

        if (! is_file($file)) {
            throw new \RuntimeException("Missing theme.json in [{$path}].");
        }

        $decoded = json_decode((string) file_get_contents($file), true);

        if (! is_array($decoded)) {
            throw new \RuntimeException("theme.json in [{$path}] is not valid JSON.");
        }

        return self::fromArray($decoded, rtrim($path, '/'));
    }

    /**
     * The Inertia component the theme wants for a public route, if it ships one.
     */
    public function component(string $key): ?string
    {
        return $this->components[$key] ?? null;
    }

    public function constraint(string $key): ?string
    {
        $value = $this->requires[$key] ?? null;

        return is_string($value) ? $value : null;
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
            'screenshot' => $this->screenshot,
            'provider' => $this->provider,
            'requires' => $this->requires,
            'tokens' => $this->tokens,
            'components' => $this->components,
        ];
    }
}
