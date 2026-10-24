<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schema;

/**
 * L-09 in the audit asked for a `(usable_type, usable_id)` index on
 * `media_usages`, assuming the unique key on
 * `(media_id, usable_type, usable_id, field)` was the only one. `morphs()`
 * already creates exactly that index, so this test is the guard instead of a
 * redundant migration: if it ever disappears, usage sync starts table-scanning.
 */
it('indexes media usages by the morph pair the sync queries use', function () {
    $indexes = collect(Schema::getIndexes('media_usages'));

    $usable = $indexes->first(
        fn (array $index): bool => $index['columns'] === ['usable_type', 'usable_id'],
    );

    expect($usable)->not->toBeNull();

    $unique = $indexes->first(
        fn (array $index): bool => $index['columns'] === ['media_id', 'usable_type', 'usable_id', 'field'],
    );

    expect($unique)->not->toBeNull()
        ->and($unique['unique'])->toBeTrue();
});
