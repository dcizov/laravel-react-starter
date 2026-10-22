<?php

namespace App\Http\Controllers;

use App\Features\Cms\Models\Comment;
use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Features\FeatureRegistry;
use App\Features\Newsletter\Models\NewsletterSubscriber;
use App\Models\Site;
use App\Models\Task;
use App\Models\User;
use App\Settings\AppSettings;
use App\Support\Rbac;
use App\Support\Sites\CurrentSite;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * The dashboard: task counts, open high-priority tasks, and the latest changes.
     * Scoped like the Tasks page: users see their own tasks, and users with tasks.view-any see every task.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $canViewAll = $user->can(Rbac::PERMISSION_TASKS_VIEW_ANY);

        // A fresh query each time, so the filters below do not build on each other.
        $scope = fn () => $canViewAll ? Task::query() : $user->tasks();
        $open = fn () => $scope()->whereNotIn('status', ['done', 'canceled']);

        $countsByStatus = $scope()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $statusCounts = collect(Task::STATUSES)
            ->map(fn (string $status) => [
                'status' => $status,
                'count' => (int) ($countsByStatus[$status] ?? 0),
            ])
            ->values();

        $attention = $open()
            ->where('priority', 'high')
            ->with('user:id,name')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn (Task $task) => $this->taskRow($task, $canViewAll));

        $recent = $scope()
            ->with('user:id,name')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn (Task $task) => $this->taskRow($task, $canViewAll));

        $total = (int) $statusCounts->sum('count');
        $done = (int) ($countsByStatus['done'] ?? 0);

        // Tasks created in the last seven days, compared with the seven days before.
        $now = now();
        $createdThisWeek = $scope()->where('created_at', '>=', $now->copy()->subDays(7))->count();
        $createdLastWeek = $scope()
            ->whereBetween('created_at', [$now->copy()->subDays(14), $now->copy()->subDays(7)])
            ->count();

        return Inertia::render('dashboard', [
            // Deferred: the cards load after the page, so a slow count does not hold up the dashboard.
            'overview' => Inertia::defer(fn () => $this->overview($user), 'overview'),
            'summary' => [
                'total' => $total,
                'open' => $open()->count(),
                'in_progress' => (int) ($countsByStatus['in progress'] ?? 0),
                'done' => $done,
                'high_priority' => $open()->where('priority', 'high')->count(),
                // Share of all tasks that are done, from 0 to 100.
                'completion' => $total > 0 ? (int) round($done / $total * 100) : 0,
                'created_this_week' => $createdThisWeek,
                // Change in percent against last week, or null when last week had no tasks.
                'created_change' => $createdLastWeek > 0
                    ? (int) round(($createdThisWeek - $createdLastWeek) / $createdLastWeek * 100)
                    : null,
            ],
            'statusCounts' => $statusCounts,
            'attention' => $attention,
            'recent' => $recent,
            'showOwner' => $canViewAll,
            // Only sent to users who can see the Users page.
            'usersCount' => $user->can(Rbac::PERMISSION_USERS_VIEW) ? User::count() : null,
        ]);
    }

    /**
     * The site overview cards. A card is included only when the user may see its data and its feature is on, and
     * every number is a count from the database, limited to the site the admin works on and to what the user may see.
     *
     * @return array<string, mixed>
     */
    private function overview(User $user): array
    {
        $features = app(FeatureRegistry::class);
        $site = app(CurrentSite::class)->site();
        $overview = ['site' => ['name' => $site->name, 'isDefault' => $site->isDefault()]];

        if ($features->isEnabled('cms') && $user->can(Rbac::PERMISSION_CONTENT_VIEW)) {
            // Authors see the counts of their own entries only, the same as on the content list.
            $entries = fn () => ContentEntry::query()
                ->withTrashed()
                ->when(! $user->can(Rbac::PERMISSION_CONTENT_EDIT_ANY), fn ($query) => $query->where('author_id', $user->id));

            $overview['content'] = [
                // Every content type, so the card can link to each list. Types are shared by all sites.
                'types' => ContentType::query()->orderBy('label')->get(['key', 'label', 'singular_label'])
                    ->map(fn (ContentType $type) => [
                        'key' => $type->key,
                        'label' => $type->label,
                        'singularLabel' => $type->singular_label,
                    ])
                    ->values(),
                'published' => (clone $entries())->whereNull('deleted_at')->live()->count(),
                'drafts' => (clone $entries())->whereNull('deleted_at')->where('status', ContentEntry::STATUS_DRAFT)->count(),
                'scheduled' => (clone $entries())->whereNull('deleted_at')
                    ->where('status', ContentEntry::STATUS_PUBLISHED)
                    ->where('published_at', '>', now())
                    ->count(),
                'trashed' => (clone $entries())->onlyTrashed()->count(),
                'canCreate' => $user->can(Rbac::PERMISSION_CONTENT_CREATE),
            ];
        }

        if ($features->isEnabled('cms') && $user->can(Rbac::PERMISSION_COMMENTS_MODERATE)) {
            $overview['comments'] = [
                'pending' => Comment::query()->whereHas('entry')->where('status', Comment::PENDING)->count(),
            ];
        }

        if ($features->isEnabled('newsletter') && $user->can(Rbac::PERMISSION_NEWSLETTER_MANAGE)) {
            $overview['newsletter'] = [
                'subscribed' => NewsletterSubscriber::query()->where('status', NewsletterSubscriber::SUBSCRIBED)->count(),
            ];
        }

        if ($features->isEnabled('seo') && $user->can(Rbac::PERMISSION_SEO_MANAGE)) {
            $overview['seo'] = [
                'indexing' => (bool) app(AppSettings::class)->seo_allow_indexing,
                // Live entries without their own search description, so the site falls back to a generic one.
                'withoutDescription' => ContentEntry::query()->live()
                    ->where(fn ($query) => $query->whereNull('seo')->orWhereNull('seo->description'))
                    ->count(),
            ];
        }

        if ($user->can(Rbac::PERMISSION_SITES_MANAGE)) {
            $overview['sites'] = [
                'count' => Site::query()->count(),
                'default' => Site::query()->where('is_default', true)->value('name'),
            ];
        }

        return $overview;
    }

    /**
     * The task columns the dashboard shows, in the same shape as the Tasks page.
     *
     * @return array<string, mixed>
     */
    private function taskRow(Task $task, bool $canViewAll): array
    {
        return [
            'id' => $task->id,
            'code' => $task->code,
            'title' => $task->title,
            'status' => $task->status,
            'label' => $task->label,
            'priority' => $task->priority,
            'owner' => $canViewAll ? $task->user?->name : null,
        ];
    }
}
