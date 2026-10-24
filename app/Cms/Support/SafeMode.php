<?php

namespace App\Cms\Support;

use App\Cms\Repositories\AddonRepository;
use App\Cms\Repositories\ThemeRepository;
use Closure;
use Illuminate\Contracts\Foundation\Application;
use Throwable;

/**
 * Registers extension service providers without letting a broken one take the
 * application down. A provider that throws is logged, recorded as
 * `status=error` with its message, and the boot continues ("Safe Mode").
 */
final class SafeMode
{
    /** @var list<array{handle: string, message: string}> */
    private array $failures = [];

    public function __construct(
        private readonly Application $app,
        private readonly AddonRepository $addons,
        private readonly ThemeRepository $themes,
    ) {}

    /**
     * @param  'addon'|'theme'  $type
     */
    public function register(string $type, string $handle, string $provider, Closure $callback): bool
    {
        try {
            $callback();

            return true;
        } catch (Throwable $e) {
            $this->failures[] = ['handle' => $handle, 'message' => $e->getMessage()];

            $this->log($type, $handle, $provider, $e);

            try {
                $type === 'addon'
                    ? $this->addons->markError($handle, $e->getMessage())
                    : $this->themes->markError($handle, $e->getMessage());
            } catch (Throwable) {
                // The database may not be reachable; Safe Mode still keeps booting.
            }

            return false;
        }
    }

    /**
     * @return list<array{handle: string, message: string}>
     */
    public function failures(): array
    {
        return $this->failures;
    }

    public function hasFailures(): bool
    {
        return $this->failures !== [];
    }

    private function log(string $type, string $handle, string $provider, Throwable $e): void
    {
        if (! $this->app->bound('log')) {
            return;
        }

        $this->app->make('log')->error('Lattice safe mode: extension failed to register.', [
            'type' => $type,
            'handle' => $handle,
            'provider' => $provider,
            'exception' => $e,
        ]);
    }
}
