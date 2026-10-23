<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\TreatmentPlan;
use App\Support\StructurePlanData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TreatmentPlanController extends Controller
{
    public function index(Request $request): Response
    {
        $plans = $request->user()->treatmentPlans()
            ->with('patient')
            ->latest('start_date')
            ->get();

        return Inertia::render('plans/index', [
            'plans' => $plans->map(fn (TreatmentPlan $plan) => StructurePlanData::plan($plan))->values(),
            'patients' => $this->patientOptions($request),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $request->user()->treatmentPlans()->create($this->withGoals($data));

        return back()->with('toast', ['type' => 'success', 'message' => 'Treatment plan created.']);
    }

    public function update(Request $request, TreatmentPlan $plan): RedirectResponse
    {
        abort_unless($plan->user_id === $request->user()->id, 403);
        $data = $this->validated($request);
        $plan->update($this->withGoals($data, $plan));

        return back()->with('toast', ['type' => 'success', 'message' => 'Treatment plan updated.']);
    }

    public function updateGoals(Request $request, TreatmentPlan $plan): RedirectResponse
    {
        abort_unless($plan->user_id === $request->user()->id, 403);
        $data = $request->validate([
            'goals' => ['required', 'array', 'max:20'],
            'goals.*.title' => ['required', 'string', 'max:500'],
            'goals.*.completed' => ['required', 'boolean'],
        ]);
        /** @var array<int, array{title: string, completed: bool}> $goals */
        $goals = $data['goals'];
        $completed = collect($goals)->where('completed', true)->count();
        $total = count($goals);
        $plan->update([
            'goals' => $goals,
            'progress' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
        ]);

        return back();
    }

    public function destroy(Request $request, TreatmentPlan $plan): RedirectResponse
    {
        abort_unless($plan->user_id === $request->user()->id, 403);
        $plan->delete();

        return back()->with('toast', ['type' => 'success', 'message' => 'Treatment plan deleted.']);
    }

    /** @return array<int, array<string, mixed>> */
    private function patientOptions(Request $request): array
    {
        return $request->user()->patients()->orderBy('first_name')->get()
            ->map(fn (Patient $patient) => ['id' => $patient->id, 'name' => $patient->first_name.' '.$patient->last_name])
            ->values()->all();
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        $userId = $request->user()->id;

        return $request->validate([
            'patient_id' => ['required', Rule::exists('patients', 'id')->where(fn ($query) => $query->where('user_id', $userId))],
            'title' => ['required', 'string', 'max:255'],
            'focus' => ['required', 'in:adhd,depression,integrated'],
            'status' => ['required', 'in:draft,active,completed'],
            'start_date' => ['required', 'date'],
            'review_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'progress' => ['required', 'integer', 'min:0', 'max:100'],
            'goals_text' => ['nullable', 'string', 'max:5000'],
            'interventions_text' => ['nullable', 'string', 'max:5000'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function withGoals(array $data, ?TreatmentPlan $plan = null): array
    {
        /** @var Collection<string, array{title: string, completed: bool}> $existing */
        $existing = collect($plan->goals ?? [])->keyBy('title');
        $goalsText = $data['goals_text'] ?? '';
        $interventionsText = $data['interventions_text'] ?? '';
        $goalsText = is_string($goalsText) ? $goalsText : '';
        $interventionsText = is_string($interventionsText) ? $interventionsText : '';
        $goals = collect(preg_split('/\r\n|\r|\n/', $goalsText) ?: [])
            ->map(fn ($goal) => trim((string) $goal))
            ->filter()
            ->map(function (string $goal) use ($existing) {
                $existingGoal = $existing->get($goal);

                return ['title' => $goal, 'completed' => (bool) ($existingGoal['completed'] ?? false)];
            })
            ->values()->all();
        $interventions = collect(preg_split('/\r\n|\r|\n/', $interventionsText) ?: [])
            ->map(fn ($item) => trim((string) $item))->filter()->values()->all();

        unset($data['goals_text'], $data['interventions_text']);

        return [...$data, 'goals' => $goals, 'interventions' => $interventions];
    }
}
