<?php

namespace App\Features;

use InvalidArgumentException;

/**
 * Works out which features are enabled for this installation, and checks the choice.
 */
final class FeatureRegistry
{
    /**
     * Every feature the code knows about, keyed by slug.
     *
     * @return array<string, class-string<Feature>>
     */
    public function available(): array
    {
        $features = [];

        foreach (config('features.available', []) as $class) {
            $features[$class::slug()] = $class;
        }

        return $features;
    }

    /**
     * The enabled features, by slug, in the order they are listed in FEATURES.
     *
     * @return list<string>
     *
     * @throws InvalidArgumentException when a name is unknown or a dependency is missing
     */
    public function enabled(): array
    {
        $slugs = array_values(array_unique(config('features.enabled', [])));

        $this->validate($slugs);

        return $slugs;
    }

    /**
     * Check a proposed list of slugs without applying it.
     *
     * @param  list<string>  $slugs
     *
     * @throws InvalidArgumentException
     */
    public function validate(array $slugs): void
    {
        $available = $this->available();

        $unknown = array_values(array_diff($slugs, array_keys($available)));

        if ($unknown !== []) {
            throw new InvalidArgumentException(
                'Unknown feature(s): '.implode(', ', $unknown).'. Known: '.implode(', ', array_keys($available)).'.',
            );
        }

        foreach ($slugs as $slug) {
            $missing = array_values(array_diff($available[$slug]::dependsOn(), $slugs));

            if ($missing !== []) {
                throw new InvalidArgumentException(
                    "Feature [{$slug}] needs ".implode(', ', $missing).' enabled too.',
                );
            }
        }
    }

    public function isEnabled(string $slug): bool
    {
        return in_array($slug, $this->enabled(), true);
    }

    /**
     * The permissions of every enabled feature.
     *
     * @return list<string>
     */
    public function permissions(): array
    {
        $available = $this->available();
        $permissions = [];

        foreach ($this->enabled() as $slug) {
            foreach ($available[$slug]::permissions() as $permission) {
                $permissions[] = $permission;
            }
        }

        return $permissions;
    }

    /**
     * The service providers of every enabled feature.
     *
     * @return list<class-string>
     */
    public function providers(): array
    {
        $available = $this->available();
        $providers = [];

        foreach ($this->enabled() as $slug) {
            $class = $available[$slug];

            foreach ($class::providers() as $provider) {
                $providers[] = $provider;
            }
        }

        return $providers;
    }
}
