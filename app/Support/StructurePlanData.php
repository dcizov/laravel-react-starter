<?php

namespace App\Support;

use App\Models\CheckIn;
use App\Models\Patient;
use App\Models\TherapySession;
use App\Models\TreatmentPlan;

class StructurePlanData
{
    /** @return array<string, mixed> */
    public static function patient(Patient $patient, bool $detailed = false): array
    {
        $data = [
            'id' => $patient->id,
            'first_name' => $patient->first_name,
            'last_name' => $patient->last_name,
            'name' => $patient->first_name.' '.$patient->last_name,
            'initials' => strtoupper(substr($patient->first_name, 0, 1).substr($patient->last_name, 0, 1)),
            'email' => $patient->email,
            'phone' => $patient->phone,
            'date_of_birth' => $patient->date_of_birth?->format('Y-m-d'),
            'pronouns' => $patient->pronouns,
            'diagnoses' => $patient->diagnoses,
            'status' => $patient->status,
            'risk_level' => $patient->risk_level,
            'notes' => $patient->notes,
            'emergency_contact' => $patient->emergency_contact,
            'created_at' => $patient->created_at?->toISOString(),
            'sessions_count' => $patient->sessions_count ?? null,
            'latest_check_in' => $patient->latest_check_in ?? null,
        ];

        if ($patient->relationLoaded('activePlan')) {
            $data['active_plan'] = $patient->activePlan ? self::plan($patient->activePlan) : null;
        }

        if ($detailed) {
            $data['treatment_plans'] = $patient->treatmentPlans->map(fn (TreatmentPlan $plan) => self::plan($plan))->values();
            $data['sessions'] = $patient->sessions->map(fn (TherapySession $session) => self::session($session))->values();
            $data['check_ins'] = $patient->checkIns->map(fn (CheckIn $checkIn) => self::checkIn($checkIn))->values();
        }

        return $data;
    }

    /** @return array<string, mixed> */
    public static function plan(TreatmentPlan $plan): array
    {
        return [
            'id' => $plan->id,
            'patient_id' => $plan->patient_id,
            'title' => $plan->title,
            'focus' => $plan->focus,
            'status' => $plan->status,
            'start_date' => $plan->start_date?->format('Y-m-d'),
            'review_date' => $plan->review_date?->format('Y-m-d'),
            'progress' => $plan->progress,
            'goals' => $plan->goals ?? [],
            'interventions' => $plan->interventions ?? [],
            'notes' => $plan->notes,
            'patient' => $plan->relationLoaded('patient') && $plan->patient ? [
                'id' => $plan->patient->id,
                'name' => $plan->patient->first_name.' '.$plan->patient->last_name,
                'initials' => strtoupper(substr($plan->patient->first_name, 0, 1).substr($plan->patient->last_name, 0, 1)),
            ] : null,
        ];
    }

    /** @return array<string, mixed> */
    public static function session(TherapySession $session): array
    {
        return [
            'id' => $session->id,
            'patient_id' => $session->patient_id,
            'treatment_plan_id' => $session->treatment_plan_id,
            'scheduled_at' => $session->scheduled_at?->toISOString(),
            'duration' => $session->duration,
            'type' => $session->type,
            'status' => $session->status,
            'location' => $session->location,
            'mood_before' => $session->mood_before,
            'mood_after' => $session->mood_after,
            'notes' => $session->notes,
            'homework' => $session->homework,
            'patient' => $session->relationLoaded('patient') && $session->patient ? [
                'id' => $session->patient->id,
                'name' => $session->patient->first_name.' '.$session->patient->last_name,
                'initials' => strtoupper(substr($session->patient->first_name, 0, 1).substr($session->patient->last_name, 0, 1)),
            ] : null,
        ];
    }

    /** @return array<string, mixed> */
    public static function checkIn(CheckIn $checkIn): array
    {
        return [
            'id' => $checkIn->id,
            'patient_id' => $checkIn->patient_id,
            'checked_in_on' => $checkIn->checked_in_on?->format('Y-m-d'),
            'mood' => $checkIn->mood,
            'energy' => $checkIn->energy,
            'focus' => $checkIn->focus,
            'sleep_hours' => $checkIn->sleep_hours !== null ? (float) $checkIn->sleep_hours : null,
            'note' => $checkIn->note,
            'patient' => $checkIn->relationLoaded('patient') && $checkIn->patient ? [
                'id' => $checkIn->patient->id,
                'name' => $checkIn->patient->first_name.' '.$checkIn->patient->last_name,
                'initials' => strtoupper(substr($checkIn->patient->first_name, 0, 1).substr($checkIn->patient->last_name, 0, 1)),
            ] : null,
        ];
    }
}
