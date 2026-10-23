<?php

namespace App\Http\Controllers;

use App\Models\TherapySession;
use App\Models\TreatmentPlan;
use App\Support\StructurePlanData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $today = now()->startOfDay();
        $todaySessions = $user->therapySessions()->with('patient')
            ->whereBetween('scheduled_at', [$today, $today->copy()->endOfDay()])
            ->orderBy('scheduled_at')->get();
        $activePlans = $user->treatmentPlans()->with('patient')->where('status', 'active')->get();
        $recentMood = $user->checkIns()->whereBetween('checked_in_on', [$today->copy()->subDays(6), $today])->avg('mood');
        $previousMood = $user->checkIns()->whereBetween('checked_in_on', [$today->copy()->subDays(13), $today->copy()->subDays(7)])->avg('mood');

        $trend = collect(range(6, 0))->map(function (int $daysAgo) use ($user, $today) {
            $date = $today->copy()->subDays($daysAgo);
            $entries = $user->checkIns()->whereDate('checked_in_on', $date)->get();

            return [
                'date' => $date->format('Y-m-d'),
                'label' => $date->format('D'),
                'mood' => $entries->count() ? round((float) $entries->avg('mood'), 1) : null,
                'energy' => $entries->count() ? round((float) $entries->avg('energy'), 1) : null,
            ];
        })->values();

        return Inertia::render('dashboard', [
            'stats' => [
                'activePatients' => $user->patients()->where('status', 'active')->count(),
                'sessionsToday' => $todaySessions->count(),
                'completedToday' => $todaySessions->where('status', 'completed')->count(),
                'activePlans' => $activePlans->count(),
                'reviewsDue' => $activePlans->where('review_date', '<=', $today->copy()->addDays(14))->count(),
                'averageMood' => $recentMood ? round((float) $recentMood, 1) : null,
                'moodChange' => $recentMood && $previousMood ? round((float) $recentMood - (float) $previousMood, 1) : null,
            ],
            'todaySessions' => $todaySessions->map(fn (TherapySession $session) => StructurePlanData::session($session))->values(),
            'planProgress' => $activePlans->sortByDesc('progress')->take(4)->map(fn (TreatmentPlan $plan) => StructurePlanData::plan($plan))->values(),
            'reviews' => $activePlans->whereNotNull('review_date')->where('review_date', '<=', $today->copy()->addDays(21))->sortBy('review_date')->take(3)->map(fn (TreatmentPlan $plan) => StructurePlanData::plan($plan))->values(),
            'trend' => $trend,
        ]);
    }
}
