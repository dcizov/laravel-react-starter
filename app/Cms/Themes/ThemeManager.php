<?php

declare(strict_types=1);

namespace App\Cms\Themes;

use App\Cms\Manifests\ThemeManifest;
use App\Cms\Repositories\ThemeRepository;
use App\Models\User;
use Illuminate\Support\Facades\File;
use RuntimeException;
use Throwable;

/**
 * The theme lifecycle: which themes exist, which one is live, and what the
 * public site should render.
 *
 * A theme is a folder plus one database row. Nothing here imports a concrete
 * theme class — the row decides, exactly like addons.
 */
final class ThemeManager
{
    /** Component used when no theme can be trusted to render the site. */
    public const FALLBACK = [
        'page' => 'public/page',
        'not_found' => 'public/not-found',
    ];

    /**
     * Token defaults so a theme that declares nothing still renders sanely.
     */
    public const DEFAULT_TOKENS = [
        'accent' => 'oklch(0.51 0.19 264)',
        'radius' => '0.625rem',
        'font' => 'Inter',
        'heading_font' => 'Inter',
    ];

    public function __construct(private readonly ThemeRepository $themes) {}

    /**
     * Every theme the install knows about: installed rows first, then folders
     * on disk that have not been registered yet.
     *
     * @return list<array<string, mixed>>
     */
    public function all(): array
    {
        $installed = [];

        foreach ($this->themes->installed() as $row) {
            try {
                $manifest = $this->themes->manifestFromRow($row);
            } catch (Throwable) {
                $manifest = null;
            }

            $installed[$row->handle] = [
                'handle' => $row->handle,
                'name' => $row->name,
                'version' => $row->version,
                'description' => $manifest?->description ?? '',
                'screenshot_url' => $this->screenshotUrl($manifest),
                'tokens' => $this->tokensFor($manifest),
                'is_active' => (bool) $row->is_active,
                'state' => $row->last_error !== null ? 'error' : ((bool) $row->is_active ? 'active' : 'inactive'),
                'error' => $row->last_error,
                'installed' => true,
                'urls' => [
                    'activate' => route('admin.appearance.activate', $row->handle),
                ],
            ];
        }

        foreach ($this->themes->discovered() as $handle => $manifest) {
            if (isset($installed[$handle])) {
                continue;
            }

            $installed[$handle] = [
                'handle' => $manifest->handle,
                'name' => $manifest->name,
                'version' => $manifest->version,
                'description' => $manifest->description,
                'screenshot_url' => $this->screenshotUrl($manifest),
                'tokens' => $this->tokensFor($manifest),
                'is_active' => false,
                'state' => 'discovered',
                'error' => null,
                'installed' => false,
                'urls' => [
                    'activate' => route('admin.appearance.activate', $manifest->handle),
                ],
            ];
        }

        return array_values($installed);
    }

    public function active(): ?ThemeManifest
    {
        return $this->themes->activeManifest();
    }

    public function activeHandle(): ?string
    {
        return $this->themes->active()?->handle;
    }

    /**
     * Activate a theme: register it if it only exists on disk, refuse it when
     * its version constraints are not met, and keep exactly one row active.
     */
    public function activate(string $handle, ?User $actor = null): ThemeManifest
    {
        $manifest = $this->themes->discovered()[$handle] ?? null;

        if ($manifest === null) {
            throw new RuntimeException("Theme [{$handle}] was not found on disk.");
        }

        $requirements = $this->themes->satisfiesRequirements($manifest);

        if (! $requirements['ok']) {
            throw new RuntimeException((string) $requirements['reason']);
        }

        if ($this->themes->find($handle) === null) {
            $this->themes->install($manifest);
        }

        $this->themes->activate($handle);

        activity('themes')
            ->event('activated')
            ->withProperties(['handle' => $handle, 'by' => $actor?->email])
            ->log('Activated theme "'.$manifest->name.'"');

        return $manifest;
    }

    /**
     * The Inertia component for a public route. A theme that is active but in
     * `error` state (its provider threw) is skipped entirely, which is how the
     * site keeps serving after a bad theme.
     */
    public function component(string $key = 'page'): string
    {
        return $this->activeTheme($key)['component'] ?? self::FALLBACK[$key] ?? self::FALLBACK['page'];
    }

    /**
     * @return array{handle: string, name: string, component: string, tokens: array<string, mixed>, degraded: bool}|null
     */
    public function activeTheme(string $key = 'page'): ?array
    {
        $row = $this->themes->active();

        if ($row === null) {
            return null;
        }

        $manifest = $this->themes->manifestFromRow($row);
        $component = $manifest->component($key);

        if ($component === null) {
            return null;
        }

        return [
            'handle' => $manifest->handle,
            'name' => $manifest->name,
            'component' => $component,
            'tokens' => $this->tokensFor($manifest),
            'degraded' => $row->last_error !== null,
        ];
    }

    /**
     * Merged, CSS-ready tokens. Values are plain strings so the frontend can
     * write them straight into custom properties.
     *
     * @return array<string, string>
     */
    public function tokens(): array
    {
        return $this->tokensFor($this->active());
    }

    /**
     * @return array<string, string>
     */
    private function tokensFor(?ThemeManifest $manifest): array
    {
        $tokens = self::DEFAULT_TOKENS;

        foreach (($manifest?->tokens ?? []) as $key => $value) {
            if (is_string($value) || is_numeric($value)) {
                $tokens[(string) $key] = (string) $value;
            }
        }

        return $tokens;
    }

    private function screenshotUrl(?ThemeManifest $manifest): ?string
    {
        if ($manifest === null || $manifest->screenshot === '') {
            return null;
        }

        $path = rtrim($manifest->path, '/').'/'.$manifest->screenshot;

        if (! File::exists($path)) {
            return null;
        }

        // Theme assets are served through the public disk, so a screenshot is
        // copied into `storage/app/public/themes/<handle>/` rather than exposing
        // the application directory.
        $relative = 'themes/'.$manifest->handle.'/'.basename($manifest->screenshot);

        return File::exists(public_path('storage/'.$relative))
            ? '/storage/'.$relative
            : null;
    }
}
