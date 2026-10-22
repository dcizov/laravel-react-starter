<?php

namespace App\Support\Sites;

use App\Models\Site;

/**
 * The site this request works on. Set once per request by App\Http\Middleware\ResolveSite. Models that belong to a
 * site filter by it (see App\Models\Concerns\BelongsToSite). Console commands and seeders fall back to the default site.
 */
final class CurrentSite
{
    // Reached through the domain of a site, or the default site's own address.
    public const MODE_DEFAULT = 'default';

    public const MODE_DOMAIN = 'domain';

    // Reached through /s/{slug}. Links on the site must carry that prefix.
    public const MODE_PATH = 'path';

    // The admin works on the site chosen in the switcher, whatever the address was.
    public const MODE_ADMIN = 'admin';

    private ?Site $site = null;

    private string $mode = self::MODE_DEFAULT;

    public function site(): Site
    {
        return $this->site ??= Site::default();
    }

    public function id(): int
    {
        return (int) $this->site()->id;
    }

    public function mode(): string
    {
        return $this->mode;
    }

    public function isDefault(): bool
    {
        return $this->site()->isDefault();
    }

    /**
     * The path that every link on this site starts with: /s/{slug} in path mode, nothing otherwise.
     */
    public function basePath(): string
    {
        return $this->mode === self::MODE_PATH ? '/s/'.$this->site()->slug : '';
    }

    public function use(Site $site, string $mode): void
    {
        $this->site = $site;
        $this->mode = $mode;
    }
}
