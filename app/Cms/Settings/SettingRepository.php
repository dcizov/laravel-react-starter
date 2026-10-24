<?php

declare(strict_types=1);

namespace App\Cms\Settings;

use App\Models\Media;
use App\Models\Setting;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * The only place that reads or writes settings.
 *
 * Rows are typed (`string`, `integer`, `boolean`, the media and secret types),
 * public values are cached because every public page reads them, and secrets
 * are encrypted at rest and never leave the server.
 */
final class SettingRepository
{
    private const CACHE_KEY = 'lattice.settings.public';

    /** @var array<string, mixed>|null */
    private ?array $rows = null;

    public function __construct(private readonly Application $app) {}

    /**
     * The settings table arrives with an update; a fresh clone must still boot.
     */
    public function installed(): bool
    {
        try {
            return Schema::hasTable('settings');
        } catch (Throwable) {
            return false;
        }
    }

    /**
     * Every stored value, keyed by setting key, with types applied.
     *
     * @return array<string, mixed>
     */
    public function all(): array
    {
        if ($this->rows !== null) {
            return $this->rows;
        }

        if (! $this->installed()) {
            return $this->rows = [];
        }

        $this->rows = [];

        foreach (Setting::query()->get() as $row) {
            $this->rows[$row->key] = $this->cast($row->type, $row->value);
        }

        return $this->rows;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->all()[$key] ?? $default;
    }

    /**
     * Stored values merged over the schema defaults for one group.
     *
     * @return array<string, mixed>
     */
    public function values(string $group): array
    {
        $values = [];

        foreach (SettingSchema::group($group)['fields'] ?? [] as $field) {
            $values[$field['key']] = $this->all()[$field['key']] ?? $field['default'];
        }

        return $values;
    }

    /**
     * Persist the given keys of one group. Unknown keys are ignored — the
     * schema is the contract, not the request body.
     *
     * @param  array<string, mixed>  $values
     */
    public function put(string $group, array $values): void
    {
        $fields = collect(SettingSchema::group($group)['fields'] ?? [])->keyBy('key');
        $changed = [];

        DB::transaction(function () use ($fields, $values, $group, &$changed): void {
            foreach ($values as $key => $value) {
                $field = $fields->get($key);

                if ($field === null) {
                    continue;
                }

                Setting::query()->updateOrCreate(
                    ['key' => $key],
                    [
                        'group' => $group,
                        'type' => $field['type'],
                        'value' => $this->store($field['type'], $value),
                        'is_public' => (bool) $field['public'],
                    ],
                );

                $changed[] = $key;
            }
        });

        if ($changed === []) {
            return;
        }

        $this->forget();

        activity('settings')
            ->event('updated')
            ->withProperties(['group' => $group, 'keys' => $changed])
            ->log('Updated '.$group.' settings');
    }

    /**
     * What the public site is allowed to know, cached for every page view.
     *
     * @return array<string, mixed>
     */
    public function publicValues(): array
    {
        if (! $this->installed()) {
            return $this->fallbackPublic();
        }

        return Cache::remember(self::CACHE_KEY, (int) config('lattice.cache.ttl', 3600), function (): array {
            $fallback = $this->fallbackPublic();

            $stored = $this->all();

            return [
                'name' => (string) (($stored['site_name'] ?? null) ?: $fallback['name']),
                'tagline' => (string) (($stored['tagline'] ?? null) ?: $fallback['tagline']),
                'description' => (string) (($stored['description'] ?? null) ?: $fallback['description']),
                'locale' => (string) ($stored['locale'] ?? 'en'),
                'robots' => (string) ($stored['robots'] ?? 'index'),
                'allow_comments' => (bool) ($stored['allow_comments'] ?? false),
                'posts_per_page' => (int) ($stored['posts_per_page'] ?? 9),
                'meta_title' => (string) (($stored['meta_title'] ?? null) ?: (($stored['site_name'] ?? null) ?: $fallback['name'])),
                'meta_description' => (string) (($stored['meta_description'] ?? null) ?: $fallback['description']),
                'logo' => $this->mediaUrl($stored['logo'] ?? null),
                'favicon' => $this->mediaUrl($stored['favicon'] ?? null),
                'accent_color' => $stored['accent_color'] ?? null,
            ];
        });
    }

    /**
     * Public chrome reads `config('lattice.site.*')` everywhere. Rather than
     * teaching every controller about settings, boot copies the saved identity
     * over those keys once.
     */
    public function applyToConfig(): void
    {
        if (! $this->installed()) {
            return;
        }

        try {
            $public = $this->publicValues();
        } catch (Throwable) {
            return;
        }

        $this->app['config']->set('lattice.site.name', $public['name']);
        $this->app['config']->set('lattice.site.tagline', $public['tagline']);
        $this->app['config']->set('lattice.site.description', $public['description']);
        $this->app['config']->set('lattice.site.locale', $public['locale']);
        $this->app['config']->set('lattice.site.robots', $public['robots']);
    }

    public function forget(): void
    {
        $this->rows = null;
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * The controller sends the schema to the client: label, type, hint,
     * options and the current value. Secrets are never included.
     *
     * @return array<string, mixed>
     */
    public function groupPayload(string $group): array
    {
        $definition = SettingSchema::group($group);
        $values = $this->values($group);

        $fields = array_map(function (array $field) use ($values): array {
            $value = $values[$field['key']] ?? null;
            $secret = $field['type'] === 'secret';

            return [
                'key' => $field['key'],
                'label' => $field['label'],
                'type' => $field['type'],
                'hint' => $field['hint'],
                'required' => $field['required'],
                'options' => $field['options'],
                'value' => $secret ? null : $value,
                'has_value' => $secret ? filled($value) : null,
                // A media setting is stored as an id; the screen still needs
                // something to show before the picker opens.
                'preview' => $field['type'] === 'media' ? $this->mediaUrl($value) : null,
            ];
        }, $definition['fields'] ?? []);

        return [
            'key' => $group,
            'label' => $definition['label'] ?? ucfirst($group),
            'description' => $definition['description'] ?? '',
            'icon' => $definition['icon'] ?? 'settings',
            'fields' => $fields,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function fallbackPublic(): array
    {
        return [
            'name' => (string) config('lattice.site.name'),
            'tagline' => (string) config('lattice.site.tagline'),
            'description' => (string) config('lattice.site.description'),
            'locale' => 'en',
            'robots' => 'index',
            'allow_comments' => false,
            'posts_per_page' => 9,
            'meta_title' => (string) config('lattice.site.name'),
            'meta_description' => (string) config('lattice.site.description'),
            'logo' => null,
            'favicon' => null,
            'accent_color' => null,
        ];
    }

    private function mediaUrl(mixed $id): ?string
    {
        if (! is_int($id) && ! (is_string($id) && ctype_digit($id))) {
            return null;
        }

        try {
            return Media::query()->find((int) $id)?->url();
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Value as stored in the JSON column. Secrets are encrypted, so reading the
     * table directly never reveals a password.
     */
    private function store(string $type, mixed $value): mixed
    {
        if ($type === 'secret') {
            return filled($value) ? Crypt::encryptString((string) $value) : null;
        }

        return $value === '' ? null : $value;
    }

    private function cast(string $type, mixed $value): mixed
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'integer', 'media' => (int) $value,
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOL),
            'secret' => $this->decrypt($value),
            default => is_scalar($value) ? (string) $value : $value,
        };
    }

    private function decrypt(mixed $value): ?string
    {
        try {
            return Crypt::decryptString((string) $value);
        } catch (Throwable) {
            return null;
        }
    }
}
