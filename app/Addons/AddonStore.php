<?php

namespace App\Addons;

use App\Models\Addon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Schema;

/**
 * Reads the lifecycle state of the installed addons. Only the lifecycle and the compiler use this; the boot path
 * reads the compiled manifest instead.
 */
final class AddonStore
{
    /**
     * @return Collection<int, Addon>
     */
    public static function rows(): Collection
    {
        if (! Schema::hasTable('addons')) {
            return new Collection;
        }

        return Addon::query()->orderBy('slug')->get();
    }

    /**
     * A fingerprint of the state that decides what the app loads. A compiled manifest whose fingerprint differs
     * from this one is out of date.
     *
     * @param  iterable<Addon>  $rows
     */
    public static function stateChecksum(iterable $rows): string
    {
        $state = [];

        foreach ($rows as $row) {
            $state[] = [$row->slug, $row->version, (bool) $row->enabled, $row->manifest_checksum];
        }

        return hash('sha256', json_encode($state, JSON_THROW_ON_ERROR));
    }
}
