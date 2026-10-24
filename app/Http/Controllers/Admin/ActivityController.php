<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

/**
 * The activity timeline.
 *
 * The causer name comes from the same statement as the rows, and the rows are
 * grouped by day on the server so the client only renders what it is given.
 */
class ActivityController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('activity.view'), 403);

        $filters = [
            'log' => $this->string($request->query('log')),
            'event' => $this->string($request->query('event')),
            'causer' => $this->integer($request->query('causer')),
            'q' => $this->string($request->query('q')),
            'from' => $this->date($request->query('from')),
            'to' => $this->date($request->query('to')),
        ];

        $activities = Activity::query()
            ->leftJoin('users', 'users.id', '=', 'activity_log.causer_id')
            ->select(['activity_log.*', 'users.name as causer_name'])
            ->when($filters['log'] !== '', fn ($query) => $query->where('activity_log.log_name', $filters['log']))
            ->when($filters['event'] !== '', fn ($query) => $query->where('activity_log.event', $filters['event']))
            ->when($filters['causer'] !== null, fn ($query) => $query->where('activity_log.causer_id', $filters['causer']))
            ->when($filters['q'] !== '', fn ($query) => $query->where('activity_log.description', 'like', '%'.$filters['q'].'%'))
            ->when($filters['from'] !== null, fn ($query) => $query->whereDate('activity_log.created_at', '>=', $filters['from']))
            ->when($filters['to'] !== null, fn ($query) => $query->whereDate('activity_log.created_at', '<=', $filters['to']))
            ->orderByDesc('activity_log.created_at')
            ->orderByDesc('activity_log.id')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (Activity $activity): array => [
                'id' => $activity->id,
                'log' => $activity->log_name,
                'event' => $activity->event,
                'description' => $activity->description,
                'causer' => $activity->causer_name,
                'subject_type' => $activity->subject_type ? class_basename($activity->subject_type) : null,
                'properties' => $activity->properties->all(),
                'created_at' => $activity->created_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/activity/index', [
            'groups' => $this->group($activities->getCollection()->all()),
            'pagination' => [
                'links' => $activities->linkCollection()->toArray(),
                'total' => $activities->total(),
                'from' => $activities->firstItem(),
                'to' => $activities->lastItem(),
            ],
            'filters' => $filters,
            'active' => collect($filters)->filter(fn ($value): bool => $value !== '' && $value !== null)->isNotEmpty(),
            'options' => [
                'logs' => $this->distinct('log_name'),
                'events' => $this->distinct('event'),
                'causers' => User::query()->orderBy('name')->get(['id', 'name'])->map(fn (User $user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                ])->all(),
            ],
        ]);
    }

    /**
     * `Today`, `Yesterday`, then a written date. Grouping on the server keeps
     * the client from re-deriving time zones from ISO strings.
     *
     * @param  list<array<string, mixed>>  $rows
     * @return list<array{date: string, label: string, items: list<array<string, mixed>>}>
     */
    private function group(array $rows): array
    {
        $groups = [];

        foreach ($rows as $row) {
            $created = $row['created_at'] !== null ? Carbon::parse($row['created_at']) : now();
            $key = $created->toDateString();

            if (! isset($groups[$key])) {
                $groups[$key] = [
                    'date' => $key,
                    'label' => $this->dayLabel($created),
                    'items' => [],
                ];
            }

            $groups[$key]['items'][] = $row;
        }

        return array_values($groups);
    }

    private function dayLabel(Carbon $date): string
    {
        return match (true) {
            $date->isToday() => 'Today',
            $date->isYesterday() => 'Yesterday',
            $date->year === now()->year => $date->format('j F'),
            default => $date->format('j F Y'),
        };
    }

    /**
     * @return list<string>
     */
    private function distinct(string $column): array
    {
        return Activity::query()
            ->whereNotNull($column)
            ->distinct()
            ->orderBy($column)
            ->pluck($column)
            ->map(fn ($value): string => (string) $value)
            ->all();
    }

    private function string(mixed $value): string
    {
        return is_string($value) ? trim($value) : '';
    }

    private function integer(mixed $value): ?int
    {
        return is_numeric($value) ? (int) $value : null;
    }

    private function date(mixed $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }
}
