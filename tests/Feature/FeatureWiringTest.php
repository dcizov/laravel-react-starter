<?php

use App\Features\FeatureRegistry;

// Each feature that can be switched on needs its pages listed in vite.config.ts (FEATURE_PAGES).
// Without an entry, a disabled feature's pages would still be bundled, or an enabled feature's pages would be dropped.
test('every feature has its pages listed in vite.config.ts', function () {
    $config = file_get_contents(base_path('vite.config.ts'));

    foreach (array_keys(app(FeatureRegistry::class)->available()) as $slug) {
        expect($config)->toMatch('/^\s+'.preg_quote($slug, '/').": \\[/m", "Missing FEATURE_PAGES entry for [{$slug}].");
    }
});
