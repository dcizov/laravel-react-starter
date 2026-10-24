<?php

declare(strict_types=1);

namespace App\Themes\Aperture;

use App\Cms\Sections\Field;
use App\Cms\Sections\Section;
use App\Cms\Sections\SectionRegistry;
use Illuminate\Support\ServiceProvider;

/**
 * Theme A. Its sections are declared in PHP and registered into the same
 * registry the editor and the validator read, so a theme can never ship a
 * section the CMS cannot validate.
 */
class ApertureServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->app->make(SectionRegistry::class)->addMany([
            Section::make('stat-band', 'Stat band', [
                Field::text('heading', 'Heading', ['required' => true]),
                Field::textarea('intro', 'Intro'),
                Field::repeater('stats', 'Stats', [
                    Field::text('value', 'Value', ['required' => true]),
                    Field::text('label', 'Label', ['required' => true]),
                ]),
            ], [
                'description' => 'A row of figures with an editorial intro.',
                'icon' => 'bar-chart-3',
            ]),
        ]);
    }
}
