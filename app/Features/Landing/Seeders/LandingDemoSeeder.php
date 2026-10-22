<?php

namespace App\Features\Landing\Seeders;

use App\Features\Landing\LandingBlocks;
use App\Settings\AppSettings;
use Illuminate\Database\Seeder;

/**
 * Adds a latest-posts block to the starter landing page, so the blog shows up on the home page.
 * Only runs on a fresh install, where no draft or published page exists yet, so an edited page is never overwritten.
 */
class LandingDemoSeeder extends Seeder
{
    public function run(): void
    {
        $settings = app(AppSettings::class);

        if ($settings->landing_draft !== null || $settings->landing_published !== null) {
            return;
        }

        $blocks = LandingBlocks::defaults();

        // Placed after the features block, or before the footer if there is none.
        $position = collect($blocks)->search(fn (array $block) => $block['type'] === 'features');
        $position = $position === false ? max(count($blocks) - 1, 0) : $position + 1;

        array_splice($blocks, $position, 0, [[
            'id' => 'posts-demo',
            'type' => 'posts',
            'data' => ['title' => 'Aus dem Blog', 'text' => 'Die neuesten Beiträge auf einen Blick.', 'count' => 3],
            'style' => ['variant' => 0],
        ]]);

        $settings->landing_draft = $blocks;
        $settings->landing_published = $blocks;
        $settings->save();
    }
}
