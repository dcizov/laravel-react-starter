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

        return Inertia::render('dashboard', [
            'summary' => [
                'total' => $statusCounts->sum('count'),
                'open' => $open()->count(),
                'in_progress' => (int) ($countsByStatus['in progress'] ?? 0),
                'done' => (int) ($countsByStatus['done'] ?? 0),
                'high_priority' => $open()->where('priority', 'high')->count(),
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
