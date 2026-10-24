<?php

declare(strict_types=1);

namespace App\Cms\Menus;

use App\Models\MenuItem;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Reads site menus for the public chrome. Menus are data — the theme renders
 * whatever the database says, so moving a link never touches React.
 */
final class MenuRepository
{
    /** Menus the public site asks for. */
    public const MENUS = ['main', 'footer'];

    /**
     * @return list<array{id: int, label: string, url: string, children: list<array<string, mixed>>}>
     */
    public function tree(string $menu): array
    {
        try {
            $items = MenuItem::query()
                ->with('page:id,slug,status,published_at,scheduled_at')
                ->where('menu', $menu)
                ->orderBy('position')
                ->orderBy('id')
                ->get();
        } catch (Throwable) {
            // The installer screen renders before the tables exist.
            return [];
        }

        $byParent = [];

        foreach ($items as $item) {
            $byParent[$item->parent_id ?? 0][] = $item;
        }

        return $this->branch($byParent, 0);
    }

    /**
     * Every menu the site needs, in one call.
     *
     * @return array<string, list<array<string, mixed>>>
     */
    public function forSite(): array
    {
        $menus = [];

        foreach (self::MENUS as $menu) {
            $menus[$menu] = $this->tree($menu);
        }

        return $menus;
    }

    public function exists(): bool
    {
        try {
            return DB::connection()->getSchemaBuilder()->hasTable('menu_items');
        } catch (Throwable) {
            return false;
        }
    }

    /**
     * @param  array<int, list<MenuItem>>  $byParent
     * @return list<array<string, mixed>>
     */
    private function branch(array $byParent, int $parentId): array
    {
        $branch = [];

        foreach ($byParent[$parentId] ?? [] as $item) {
            $branch[] = [
                'id' => $item->id,
                'label' => $item->label,
                'url' => $item->href(),
                'children' => $this->branch($byParent, $item->id),
            ];
        }

        return $branch;
    }
}
