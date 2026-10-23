<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\TherapySession;
use App\Models\TreatmentPlan;
use App\Support\StructurePlanData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SessionController extends Controller
{
    public function index(Request $request): Response
    {
        $sessions = $request->user()->therapySessions()
            ->with('patient')->latest('scheduled_at')->get();

        return Inertia::render('sessions/index', [
            'sessions' => $sessions->map(fn (TherapySession $session) => StructurePlanData::session($session))->values(),
            'patients' => $this->patientOptions($request),
            'plans' => $request->user()->treatmentPlans()->with('patient')->where('status', 'active')->get()
                ->map(fn (TreatmentPlan $plan) => [
                    'id' => $plan->id,
                    'patient_id' => $plan->patient_id,
                    'title' => $plan->title,
                ])->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $this->ensurePlanMatchesPatient($request, $data);
        $request->user()->therapySessions()->create($data);

        return back()->with('toast', ['type' => 'success', 'message' => 'Session scheduled.']);
    }

    public function update(Request $request, TherapySession $session): RedirectResponse
    {
        abort_unless($session->user_id === $request->user()->id, 403);
        $data = $this->validated($request);
        $this->ensurePlanMatchesPatient($request, $data);
        $session->update($data);

        return back()->with('toast', ['type' => 'success', 'message' => 'Session updated.']);
    }

    public function complete(Request $request, TherapySession $session): RedirectResponse
    {
        abort_unless($session->user_id === $request->user()->id, 403);
        $session->update(['status' => 'completed']);

        return back()->with('toast', ['type' => 'success', 'message' => 'Session marked complete.']);
    }

    public function destroy(Request $request, TherapySession $session): RedirectResponse
    {
        abort_unless($session->user_id === $request->user()->id, 403);
        $session->delete();

        return back()->with('toast', ['type' => 'success', 'message' => 'Session removed.']);
    }

    /** @return array<int, array<string, mixed>> */
    private function patientOptions(Request $request): array
    {
        return $request->user()->patients()->where('status', 'active')->orderBy('first_name')->get()
            ->map(fn (Patient $patient) => ['id' => $patient->id, 'name' => $patient->first_name.' '.$patient->last_name])
            ->values()->all();
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        $userId = $request->user()->id;
        $data = $request->validate([
            'patient_id' => ['required', Rule::exists('patients', 'id')->where(fn ($query) => $query->where('user_id', $userId))],
            'treatment_plan_id' => ['nullable', Rule::exists('treatment_plans', 'id')->where(fn ($query) => $query->where('user_id', $userId))],
            'scheduled_at' => ['required', 'date'],
            'duration' => ['required', 'integer', 'min:10', 'max:240'],
            'type' => ['required', 'in:individual,intake,follow_up,plan_review'],
            'status' => ['required', 'in:scheduled,completed,cancelled'],
            'location' => ['required', 'in:video,in_person,phone'],
            'mood_before' => ['nullable', 'integer', 'min:1', 'max:10'],
            'mood_after' => ['nullable', 'integer', 'min:1', 'max:10'],
            'notes' => ['nullable', 'string', 'max:10000'],
            'homework' => ['nullable', 'string', 'max:5000'],
        ]);
        $data['treatment_plan_id'] = $data['treatment_plan_id'] ?? null;

        return $data;
    }

    /** @param array<string, mixed> $data */
    private function ensurePlanMatchesPatient(Request $request, array $data): void
    {
        if (empty($data['treatment_plan_id'])) {
            return;
        }

        $plan = $request->user()->treatmentPlans()->find((int) $data['treatment_plan_id']);
        if (! $plan || (int) $plan->patient_id !== (int) $data['patient_id']) {
            throw ValidationException::withMessages(['treatment_plan_id' => 'Choose a plan belonging to this patient.']);
        }
    }
}
