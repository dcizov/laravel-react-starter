<?php

namespace App\Addons\Discovery;

use App\Addons\Manifest\AddonManifest;

/**
 * What discovery found: the valid addons by slug, and the problems by addon.json path.
 */
final readonly class DiscoveryResult
{
    /**
     * @param  array<string, AddonManifest>  $manifests
     * @param  array<string, list<string>>  $errors
     */
    public function __construct(
        public array $manifests,
        public array $errors,
    ) {}

    public function hasErrors(): bool
    {
        return $this->errors !== [];
    }

    /**
     * The problems reported for the addon folder with this slug.
     *
     * @return list<string>
     */
    public function errorsFor(string $slug): array
    {
        $found = [];

        foreach ($this->errors as $file => $messages) {
            if (str_ends_with($file, '/'.$slug.'/addon.json')) {
                $found = [...$found, ...$messages];
            }
        }

        return $found;
    }
}
