<?php

namespace App\Addons\Discovery;

use App\Addons\Exceptions\AddonManifestException;
use App\Addons\Manifest\AddonManifest;
use App\Addons\Manifest\ManifestValidator;
use JsonException;

/**
 * Finds addons in the local addon folders and reads their addon.json files. Reads the filesystem only.
 */
final class AddonDiscovery
{
    /**
     * @param  list<string>  $paths
     */
    public function __construct(
        private readonly ManifestValidator $validator,
        private readonly array $paths,
    ) {}

    public function discover(): DiscoveryResult
    {
        $manifests = [];
        $errors = [];
        $duplicates = [];

        foreach ($this->paths as $root) {
            if (! is_dir($root)) {
                continue;
            }

            $files = glob(rtrim($root, '/').'/*/addon.json') ?: [];
            sort($files);

            foreach ($files as $file) {
                try {
                    $manifest = $this->readManifest($file);
                } catch (AddonManifestException $e) {
                    $errors[$file] = $e->errors;

                    continue;
                }

                $slug = $manifest->slug;

                if (isset($duplicates[$slug])) {
                    $errors[$file][] = "The slug \"{$slug}\" is already used by another addon.";

                    continue;
                }

                if (isset($manifests[$slug])) {
                    $first = $manifests[$slug]->manifestPath();
                    $message = "The slug \"{$slug}\" is defined in both {$first} and {$file}.";

                    unset($manifests[$slug]);
                    $duplicates[$slug] = true;
                    $errors[$first][] = $message;
                    $errors[$file][] = $message;

                    continue;
                }

                $manifests[$slug] = $manifest;
            }
        }

        foreach ($this->dependencyCycles($manifests) as $cycle) {
            $errors[$manifests[$cycle[0]]->manifestPath()][] = 'Dependency cycle: '.implode(' -> ', $cycle).'.';
        }

        return new DiscoveryResult($manifests, $errors);
    }

    /**
     * Read one addon.json. When an expected checksum is given, the file must still match it.
     *
     * @throws AddonManifestException
     */
    public function readManifest(string $file, ?string $expectedChecksum = null): AddonManifest
    {
        if (! is_file($file)) {
            throw new AddonManifestException($file, ['addon.json was not found.']);
        }

        $raw = file_get_contents($file);

        if ($raw === false) {
            throw new AddonManifestException($file, ['addon.json could not be read.']);
        }

        $checksum = hash('sha256', $raw);

        if ($expectedChecksum !== null && ! hash_equals($expectedChecksum, $checksum)) {
            throw new AddonManifestException($file, [
                'addon.json changed on disk after the addon was installed. Restore the installed version. Updating addons is not supported yet.',
            ]);
        }

        try {
            $data = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw new AddonManifestException($file, ['Invalid JSON: '.$e->getMessage()]);
        }

        if (! is_array($data)) {
            throw new AddonManifestException($file, ['addon.json must contain a JSON object.']);
        }

        $directory = dirname($file);
        $errors = $this->validator->errors($data, $directory, basename($directory));

        if ($errors !== []) {
            throw new AddonManifestException($file, $errors);
        }

        return AddonManifest::fromValidated($data, $directory, $checksum);
    }

    /**
     * Every dependency cycle among the valid addons, each listed as slugs that start and end with the same one.
     *
     * @param  array<string, AddonManifest>  $manifests
     * @return list<list<string>>
     */
    private function dependencyCycles(array $manifests): array
    {
        $cycles = [];
        $finished = [];

        $visit = function (string $slug, array $path) use (&$visit, &$cycles, &$finished, $manifests): void {
            $position = array_search($slug, $path, true);

            if ($position !== false) {
                $cycles[] = [...array_slice($path, $position), $slug];

                return;
            }

            if (isset($finished[$slug])) {
                return;
            }

            foreach (array_keys($manifests[$slug]->requires) as $dependency) {
                if (isset($manifests[$dependency])) {
                    $visit($dependency, [...$path, $slug]);
                }
            }

            $finished[$slug] = true;
        };

        foreach (array_keys($manifests) as $slug) {
            $visit((string) $slug, []);
        }

        return $cycles;
    }
}
