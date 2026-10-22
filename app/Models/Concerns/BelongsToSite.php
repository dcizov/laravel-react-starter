<?php

namespace App\Models\Concerns;

use App\Models\Scopes\SiteScope;
use App\Models\Site;
use App\Support\Sites\CurrentSite;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * For models that belong to one site. Queries only see the current site, and new rows take its id.
 */
trait BelongsToSite
{
    public static function bootBelongsToSite(): void
    {
        static::addGlobalScope(new SiteScope);

        static::creating(function (Model $model) {
            if (empty($model->getAttribute('site_id'))) {
                $model->setAttribute('site_id', app(CurrentSite::class)->id());
            }
        });
    }

    /**
     * @return BelongsTo<Site, $this>
     */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }
}
