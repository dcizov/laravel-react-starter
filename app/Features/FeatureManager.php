<?php

namespace App\Features;

use Illuminate\Support\Facades\Process;
use InvalidArgumentException;
use RuntimeException;

/**
 * Switches features on and off by changing FEATURES in .env.
 *
 * Enabling runs the feature's migrations in a fresh PHP process, because a newly enabled feature's
 * migrations are only loaded when the application boots. If anything fails, the .env file is put back
 * the way it was. Disabling keeps the feature's tables and data.
 */
final class FeatureManager
{
    public function __construct(private FeatureRegistry $registry) {}

    /**
     * @return list<string> the enabled features after the change
     *
     * @throws InvalidArgumentException|RuntimeException
     */
    public function enable(string $slug, bool $migrate = true): array
    {
        $current = $this->registry->enabled();

        if (! array_key_exists($slug, $this->registry->available())) {
            throw new InvalidArgumentException("Unknown feature [{$slug}]. Run feature:list to see the options.");
        }

        if (in_array($slug, $current, true)) {
            return $current;
        }

        $next = [...$current, $slug];
        $this->registry->validate($next);

        $this->apply($next, function () use ($migrate) {
            if ($migrate) {
                $this->artisan('migrate', ['force' => true]);
            }
        });

        return $next;
    }

    /**
     * @return list<string> the enabled features after the change
     *
     * @throws InvalidArgumentException|RuntimeException
     */
    public function disable(string $slug): array
    {
        $current = $this->registry->enabled();

        if (! in_array($slug, $current, true)) {
            return $current;
        }

        $dependents = [];

        foreach ($current as $other) {
            if (in_array($slug, $this->registry->available()[$other]::dependsOn(), true)) {
                $dependents[] = $other;
            }
        }

        if ($dependents !== []) {
            throw new InvalidArgumentException(
                "Cannot disable [{$slug}] while ".implode(', ', $dependents).' depends on it. Disable those first.',
            );
        }

        $next = array_values(array_diff($current, [$slug]));

        $this->apply($next);

        return $next;
    }

    /**
     * Write the new list, then run the work. Puts the old value back if the work fails.
     *
     * @param  list<string>  $slugs
     */
    private function apply(array $slugs, ?\Closure $work = null): void
    {
        $path = base_path('.env');
        $before = is_file($path) ? (string) file_get_contents($path) : null;

        $this->writeFeatures($path, $before, $slugs);

        try {
            $this->artisan('config:clear');

            if ($work !== null) {
                $work();
            }
        } catch (\Throwable $e) {
            if ($before === null) {
                @unlink($path);
            } else {
                file_put_contents($path, $before);
            }

            $this->artisan('config:clear');

            throw new RuntimeException('Feature change rolled back: '.$e->getMessage(), previous: $e);
        }
    }

    /**
     * @param  list<string>  $slugs
     */
    private function writeFeatures(string $path, ?string $contents, array $slugs): void
    {
        $line = 'FEATURES='.implode(',', $slugs);

        if ($contents === null || trim($contents) === '') {
            $updated = $line."\n";
        } elseif (preg_match('/^FEATURES=.*$/m', $contents)) {
            $updated = preg_replace_callback('/^FEATURES=.*$/m', fn () => $line, $contents, 1);
        } else {
            $updated = rtrim($contents, "\n")."\n".$line."\n";
        }

        file_put_contents($path, $updated);
    }

    /**
     * Run an artisan command in a new process, so it reads the .env file that was just written.
     *
     * @param  array<string, mixed>  $parameters
     */
    private function artisan(string $command, array $parameters = []): void
    {
        $result = Process::path(base_path())
            ->timeout(600)
            ->run([PHP_BINARY, 'artisan', $command, ...$this->flags($parameters)]);

        if ($result->failed()) {
            throw new RuntimeException("php artisan {$command} failed: ".trim($result->errorOutput() ?: $result->output()));
        }
    }

    /**
     * @param  array<string, mixed>  $parameters
     * @return list<string>
     */
    private function flags(array $parameters): array
    {
        $flags = [];

        foreach ($parameters as $name => $value) {
            if ($value === true) {
                $flags[] = "--{$name}";
            }
        }

        return $flags;
    }
}
