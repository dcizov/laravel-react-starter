<?php

namespace App\Http\Controllers;

use App\Models\CheckIn;
use App\Models\Patient;
use App\Support\StructurePlanData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CheckInController extends Controller
{
    public function index(Request $request): Response
    {
        $checkIns = $request->user()->checkIns()->with('patient')->latest('checked_in_on')->get();

        return Inertia::render('check-ins/index', [
            'checkIns' => $checkIns->map(fn (CheckIn $checkIn) => StructurePlanData::checkIn($checkIn))->values(),
            'patients' => $request->user()->patients()->where('status', 'active')->orderBy('first_name')->get()
                ->map(fn (Patient $patient) => ['id' => $patient->id, 'name' => $patient->first_name.' '.$patient->last_name])->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->user()->checkIns()->create($this->validated($request));

        return back()->with('toast', ['type' => 'success', 'message' => 'Check-in recorded.']);
    }

    public function update(Request $request, CheckIn $checkIn): RedirectResponse
    {
        abort_unless($checkIn->user_id === $request->user()->id, 403);
        $checkIn->update($this->validated($request));

        return back()->with('toast', ['type' => 'success', 'message' => 'Check-in updated.']);
    }

    public function destroy(Request $request, CheckIn $checkIn): RedirectResponse
    {
        abort_unless($checkIn->user_id === $request->user()->id, 403);
        $checkIn->delete();

        return back()->with('toast', ['type' => 'success', 'message' => 'Check-in deleted.']);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        $userId = $request->user()->id;

        return $request->validate([
            'patient_id' => ['required', Rule::exists('patients', 'id')->where(fn ($query) => $query->where('user_id', $userId))],
            'checked_in_on' => ['required', 'date', 'before_or_equal:today'],
            'mood' => ['required', 'integer', 'min:1', 'max:10'],
            'energy' => ['required', 'integer', 'min:1', 'max:10'],
            'focus' => ['required', 'integer', 'min:1', 'max:10'],
            'sleep_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'note' => ['nullable', 'string', 'max:3000'],
        ]);
    }
}
