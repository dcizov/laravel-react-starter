<?php

namespace App\Cms\Manifests;

/**
 * Structural validation for addon and theme manifests.
 *
 * Returns a list of human readable errors — an empty list means the manifest
 * can be installed. Runtime requirements (PHP, Laravel, Lattice, other addons)
 * are checked separately by the lifecycle manager, because they change.
 */
final class ManifestValidator
{
    /**
     * @param  array<string, mixed>  $data
     * @return list<string>
     */
    public static function validateAddon(array $data): array
    {
        $errors = self::validateCommon($data);

        foreach (['provider'] as $key) {
            if (! isset($data[$key]) || ! is_string($data[$key]) || trim($data[$key]) === '') {
                $errors[] = "addon.json is missing the [{$key}] key.";
            }
        }

        if (isset($data['navigation']) && ! is_array($data['navigation'])) {
            $errors[] = 'addon.json [navigation] must be an array.';
        }

        foreach ((array) ($data['navigation'] ?? []) as $index => $item) {
            if (! is_array($item)) {
                $errors[] = "addon.json navigation entry #{$index} must be an object.";

                continue;
            }

            foreach (['section', 'label', 'route'] as $key) {
                if (! isset($item[$key]) || ! is_string($item[$key]) || $item[$key] === '') {
                    $errors[] = "addon.json navigation entry #{$index} is missing [{$key}].";
                }
            }
        }

        if (isset($data['permissions']) && ! is_array($data['permissions'])) {
            $errors[] = 'addon.json [permissions] must be an array.';
        }

        return $errors;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return list<string>
     */
    public static function validateTheme(array $data): array
    {
        $errors = self::validateCommon($data);

        if (! isset($data['provider']) || ! is_string($data['provider']) || $data['provider'] === '') {
            $errors[] = 'theme.json is missing the [provider] key.';
        }

        if (isset($data['tokens']) && ! is_array($data['tokens'])) {
            $errors[] = 'theme.json [tokens] must be an object.';
        }

        return $errors;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return list<string>
     */
    private static function validateCommon(array $data): array
    {
        $errors = [];

        foreach (['handle', 'name', 'version'] as $key) {
            if (! isset($data[$key]) || ! is_string($data[$key]) || trim($data[$key]) === '') {
                $errors[] = "Manifest is missing the [{$key}] key.";
            }
        }

        if (isset($data['handle']) && is_string($data['handle'])
            && preg_match('/^[A-Z][A-Za-z0-9]*$/', $data['handle']) !== 1) {
            $errors[] = 'Manifest [handle] must be StudlyCase, e.g. "PostCraft".';
        }

        if (isset($data['requires']) && ! is_array($data['requires'])) {
            $errors[] = 'Manifest [requires] must be an object.';
        }

        return $errors;
    }
}
