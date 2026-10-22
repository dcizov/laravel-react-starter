<?php

namespace App\Models\Scopes;

use App\Support\Sites\CurrentSite;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Limits every query to the current site. A query can opt out with withoutGlobalScope(SiteScope::class), for
 * the admin screens that count across sites.
 *
 * @implements Scope<Model>
 */
class SiteScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where($model->qualifyColumn('site_id'), app(CurrentSite::class)->id());
    }
}
