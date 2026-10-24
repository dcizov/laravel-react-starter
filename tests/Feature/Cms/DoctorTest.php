<?php

use Illuminate\Support\Facades\File;

it('reports which frontend assets the browser is being served', function () {
    File::put(public_path('hot'), 'http://localhost:5173');

    try {
        $this->artisan('lattice:doctor')
            ->expectsOutputToContain('dev server')
            ->assertSuccessful();
    } finally {
        File::delete(public_path('hot'));
    }

    $this->artisan('lattice:doctor')
        ->expectsOutputToContain('Frontend assets')
        ->assertSuccessful();
});

it('warns when the build is older than the sources', function () {
    $manifest = public_path('build/manifest.json');

    if (! File::exists($manifest)) {
        $this->markTestSkipped('No frontend build in this checkout.');
    }

    $source = resource_path('js/app.tsx');
    $original = File::lastModified($manifest);

    touch($source, $original + 60);

    try {
        $this->artisan('lattice:doctor')
            ->expectsOutputToContain('stale')
            ->assertSuccessful();
    } finally {
        touch($source, $original - 60);
        File::put($manifest, File::get($manifest));
        touch($manifest, $original);
    }
});
