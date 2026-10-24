<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\Page;
use Illuminate\Database\Seeder;

/**
 * The site chrome needs menus to exist before a theme can render a header.
 * Items point at pages by id, so a later slug change keeps the link working.
 */
class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $main = [
            ['Home', 'home'],
            ['Services', 'services'],
            ['About', 'about'],
            ['Contact', 'contact'],
        ];

        foreach ($main as $position => [$label, $slug]) {
            $this->item('main', $label, $position, $slug);
        }

        foreach ([['Imprint', 'imprint'], ['Contact', 'contact']] as $position => [$label, $slug]) {
            $this->item('footer', $label, $position, $slug);
        }
    }

    private function item(string $menu, string $label, int $position, string $slug): void
    {
        $page = Page::query()->where('slug', $slug)->first();

        MenuItem::query()->updateOrCreate(
            ['menu' => $menu, 'label' => $label],
            [
                'type' => $page === null ? MenuItem::TYPE_URL : MenuItem::TYPE_PAGE,
                'page_id' => $page?->id,
                'url' => $page === null ? '/'.$slug : null,
                'position' => $position,
                'parent_id' => null,
            ],
        );
    }
}
