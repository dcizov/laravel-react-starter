<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Cms\Analytics\TrafficRepository;
use App\Cms\Permissions\AbilityMap;
use App\Cms\Repositories\AddonRepository;
use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Page;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

/**
 * The dashboard is deliberately cheap: a handful of aggregates, one traffic
 * series and two short lists — no per-row follow-up queries (the author and
 * causer names come from the same statement). The step asserts the budget.
 */
class DashboardController extends Controller
{
    public function __construct(
        private readonly TrafficRepository $traffic,
        private readonly AddonRepository $addons,
        private readonly AbilityMap $abilities,
    ) {}

    public function __invoke(Request $request): Response
    {
        $pageCounts = Page::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $traffic = $this->traffic->report(14);
        $abilities = $this->abilities->for($request->user());

        $addons = collect($this->addons->installed())->map(fn (object $row): array => [
            'handle' => $row->handle,
            'name' => $row->name,
            'version' => $row->version,
            'status' => $row->status,
            'error' => $row->last_error,
        ])->values();

        return Inertia::render('dashboard', [
            'kpis' => [
                [
                    'key' => 'pages',
                    'label' => 'Published pages',
                    'value' => (int) ($pageCounts[Page::STATUS_PUBLISHED] ?? 0),
                    'hint' => (int) ($pageCounts[Page::STATUS_DRAFT] ?? 0).' in draft',
                    'icon' => 'file-text',
                    'href' => route('admin.pages.index'),
                ],
                [
                    'key' => 'views',
                    'label' => 'Page views',
                    'value' => $traffic['total'],
                    'hint' => $this->trendHint($traffic['change']),
                    'icon' => 'eye',
                    'href' => null,
                ],
                [
                    'key' => 'media',
                    'label' => 'Media items',
                    'value' => Media::query()->count(),
                    'hint' => 'In the library',
                    'icon' => 'image',
                    'href' => route('admin.media.index'),
                ],
                [
                    'key' => 'team',
                    'label' => 'Team members',
                    'value' => User::query()->count(),
                    'hint' => 'With access',
                    'icon' => 'users',
                    'href' => route('admin.users.index'),
                ],
            ],
            'traffic' => [
                'series' => $traffic['series'],
                'total' => $traffic['total'],
                'previous' => $traffic['previous'],
                'change' => $traffic['change'],
                'days' => 14,
            ],
            'recent' => $this->recentActivity(),
            'drafts' => $this->drafts(),
            'addons' => [
                'rows' => $addons,
                'healthy' => $addons->where('status', 'active')->count(),
                'errors' => $addons->where('status', 'error')->count(),
                'inactive' => $addons->where('status', 'inactive')->count(),
            ],
            // Same map the layout already received: the gate would run the
            // permission queries again for every flag.
            'can' => [
                'pages' => $abilities['pages.view'] ?? false,
                'media' => $abilities['media.view'] ?? false,
                'users' => $abilities['users.view'] ?? false,
                'addons' => $abilities['addons.view'] ?? false,
                'activity' => $abilities['activity.view'] ?? false,
            ],
        ]);
    }

    private function trendHint(?int $change): string
    {
        if ($change === null) {
            return 'No views yet';
        }

        return ($change >= 0 ? '+' : '').$change.'% vs the previous 14 days';
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function recentActivity(): array
    {
        return Activity::query()
            ->leftJoin('users', 'users.id', '=', 'activity_log.causer_id')
            ->select(['activity_log.*', 'users.name as causer_name'])
            ->latest('activity_log.id')
            ->limit(6)
            ->get()
            ->map(fn (Activity $activity): array => [
                'id' => $activity->id,
                'log' => $activity->log_name,
                'event' => $activity->event,
                'description' => $activity->description,
                'causer' => $activity->causer_name,
                'created_at' => $activity->created_at?->toIso8601String(),
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function drafts(): array
    {
        return Page::query()
            ->leftJoin('users', 'users.id', '=', 'pages.author_id')
            ->where('pages.status', Page::STATUS_DRAFT)
            ->select(['pages.id', 'pages.title', 'pages.slug', 'pages.updated_at', 'users.name as author_name'])
            ->latest('pages.updated_at')
            ->limit(5)
            ->get()
            ->map(fn (Page $page): array => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'author' => $page->author_name,
                'updated_at' => $page->updated_at?->toIso8601String(),
                'edit_url' => route('admin.pages.edit', $page->id),
            ])
            ->all();
    }
}
