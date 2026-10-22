<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A site the app publishes: its own pages, posts, categories, tags, calls to action and SEO defaults.
 *
 * Visitors reach a site by its domain, or by /s/{slug} when it has no domain (or while developing locally). The
 * default site has no domain of its own: it answers every address that no other site claims, and it keeps the
 * unprefixed URLs that existed before there were several sites.
 *
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $domain
 * @property string $locale
 * @property bool $is_default
 * @property array<string, mixed>|null $settings
 */
class Site extends Model
{
    public const LOCALES = ['en', 'de'];

    /** Slugs that would clash with the app's own URLs under /s/. */
    public const RESERVED_SLUGS = ['admin', 'api', 's', 'settings', 'up', 'errors', 'language', 'login', 'register', 'dashboard', 'profile', 'storage', 'build', 'sitemap', 'robots'];

    protected $table = 'sites';

    protected $fillable = [
        'name',
        'slug',
        'domain',
        'locale',
        'is_default',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'settings' => 'array',
        ];
    }

    /**
     * The default site. Migrations always create one, so it is missing only on a broken install.
     */
    public static function default(): self
    {
        return static::query()->where('is_default', true)->firstOrFail();
    }

    /**
     * The site that serves a host name, or null when no site claims it.
     */
    public static function forHost(string $host): ?self
    {
        return static::query()->where('domain', strtolower($host))->first();
    }

    public function isDefault(): bool
    {
        return (bool) $this->is_default;
    }

    /**
     * The public address of the site, as a visitor would type it.
     */
    public function publicUrl(): string
    {
        if (filled($this->domain)) {
            return $this->schemeOfAppUrl().'://'.$this->domain;
        }

        // Path mode: the default site keeps the plain app URL.
        return rtrim((string) config('app.url'), '/').($this->isDefault() ? '' : '/s/'.$this->slug);
    }

    /**
     * The site's description, used for SEO when a page has none of its own.
     */
    public function description(): ?string
    {
        $value = $this->settings['description'] ?? null;

        return is_string($value) && $value !== '' ? $value : null;
    }

    public function homeSlug(): ?string
    {
        $value = $this->settings['home_slug'] ?? null;

        return is_string($value) && $value !== '' ? $value : null;
    }

    private function schemeOfAppUrl(): string
    {
        return str_starts_with((string) config('app.url'), 'https://') ? 'https' : 'http';
    }
}
