<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Support\StructurePlanData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientController extends Controller
{
    public function index(Request $request): Response
    {
        $patients = $request->user()->patients()
            ->with('activePlan')
            ->withCount('sessions')
            ->withMax('checkIns as latest_check_in', 'checked_in_on')
            ->orderBy('first_name')
            ->get();

        return Inertia::render('patients/index', [
            'patients' => $patients->map(fn (Patient $patient) => StructurePlanData::patient($patient))->values(),
        ]);
    }

    public function show(Request $request, Patient $patient): Response
    {
        abort_unless($patient->user_id === $request->user()->id, 403);

        $patient->load([
            'activePlan',
            'treatmentPlans' => fn ($query) => $query->latest('start_date'),
            'sessions' => fn ($query) => $query->latest('scheduled_at'),
            'checkIns' => fn ($query) => $query->latest('checked_in_on')->limit(12),
        ]);

        return Inertia::render('patients/show', [
            'patient' => StructurePlanData::patient($patient, true),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->user()->patients()->create($this->validated($request));

        return back()->with('toast', ['type' => 'success', 'message' => 'Patient added to your practice.']);
    }

    public function update(Request $request, Patient $patient): RedirectResponse
    {
        abort_unless($patient->user_id === $request->user()->id, 403);
        $patient->update($this->validated($request));

        return back()->with('toast', ['type' => 'success', 'message' => 'Patient details updated.']);
    }

    public function destroy(Request $request, Patient $patient): RedirectResponse
    {
        abort_unless($patient->user_id === $request->user()->id, 403);
        $patient->delete();

        return redirect()->route('patients.index')->with('toast', ['type' => 'success', 'message' => 'Patient record deleted.']);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'pronouns' => ['nullable', 'string', 'max:50'],
            'diagnoses' => ['required', 'string', 'max:1000'],
            'status' => ['required', 'in:active,waitlist,discharged'],
            'risk_level' => ['required', 'in:low,moderate,high'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'emergency_contact' => ['nullable', 'string', 'max:255'],
        ]);
    }
}
