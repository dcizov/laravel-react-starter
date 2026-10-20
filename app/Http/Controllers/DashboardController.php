<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use App\Support\Rbac;
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
