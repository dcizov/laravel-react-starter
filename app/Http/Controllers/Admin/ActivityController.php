<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class ActivityController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('activity.view'), 403);

        $log = trim((string) $request->query('log', ''));

        $activities = Activity::query()
            ->with('causer')
            ->when($log !== '', fn ($query) => $query->where('log_name', $log))
            ->latest()
            ->paginate(30)
            ->withQueryString()
            ->through(fn (Activity $activity): array => [
                'id' => $activity->id,
                'log' => $activity->log_name,
                'event' => $activity->event,
                'description' => $activity->description,
                'causer' => $activity->causer?->name,
                'subject_type' => $activity->subject_type ? class_basename($activity->subject_type) : null,
                'properties' => $activity->properties->all(),
                'created_at' => $activity->created_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/activity/index', [
            'activities' => $activities,
            'filters' => ['log' => $log],
            'logs' => Activity::query()->distinct()->orderBy('log_name')->pluck('log_name')->filter()->values(),
        ]);
    }
}
