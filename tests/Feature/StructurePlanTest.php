<?php

use App\Models\CheckIn;
use App\Models\Patient;
use App\Models\TherapySession;
use App\Models\TreatmentPlan;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

function structurePatientPayload(array $overrides = []): array
{
    return array_merge([
        'first_name' => 'Alex',
        'last_name' => 'Morgan',
        'email' => 'alex@example.test',
        'phone' => '+49 151 12345678',
        'date_of_birth' => '1991-05-12',
        'pronouns' => 'they/them',
        'diagnoses' => 'ADHD, inattentive presentation; low mood',
        'status' => 'active',
        'risk_level' => 'low',
        'notes' => 'Prefers small, collaborative experiments.',
        'emergency_contact' => 'Sam Morgan · +49 151 87654321',
    ], $overrides);
}

function structurePlanPayload(Patient $patient, array $overrides = []): array
{
    return array_merge([
        'patient_id' => $patient->id,
        'title' => 'Gentle structure and mood support',
        'focus' => 'integrated',
        'status' => 'active',
        'start_date' => today()->toDateString(),
        'review_date' => today()->addMonth()->toDateString(),
        'progress' => 20,
        'goals_text' => "Start one task with a five-minute timer\nPlan one pleasant activity",
        'interventions_text' => "Behavioral activation\nTask breakdown",
        'notes' => 'Review pacing together.',
    ], $overrides);
}

function structureSessionPayload(Patient $patient, TreatmentPlan $plan, array $overrides = []): array
{
    return array_merge([
        'patient_id' => $patient->id,
        'treatment_plan_id' => $plan->id,
        'scheduled_at' => now()->addDay()->setTime(10, 0)->toDateTimeString(),
        'duration' => 50,
        'type' => 'individual',
        'status' => 'scheduled',
        'location' => 'video',
        'mood_before' => null,
        'mood_after' => null,
        'notes' => null,
        'homework' => null,
    ], $overrides);
}

test('core practice pages require authentication', function (string $path) {
    $this->get($path)->assertRedirect(route('login'));
})->with(['/dashboard', '/patients', '/plans', '/sessions', '/check-ins']);

test('a clinician can create read update and delete a patient', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->get('/patients')->assertOk();
    $this->post('/patients', structurePatientPayload())->assertRedirect();
    $patient = Patient::query()->sole();
    $this->get("/patients/{$patient->id}")->assertOk();
    $this->put("/patients/{$patient->id}", structurePatientPayload(['first_name' => 'Jordan']))->assertRedirect();

    expect($patient->fresh()->first_name)->toBe('Jordan');
    $this->delete("/patients/{$patient->id}")->assertRedirect(route('patients.index'));
    $this->assertDatabaseMissing('patients', ['id' => $patient->id]);
});

test('a clinician can manage a treatment plan and complete goals optimistically', function () {
    $user = User::factory()->create();
    $patient = $user->patients()->create(structurePatientPayload());
    $this->actingAs($user);

    $this->post('/plans', structurePlanPayload($patient))->assertRedirect();
    $plan = TreatmentPlan::query()->sole();
    expect($plan->goals)->toHaveCount(2);

    $this->patch("/plans/{$plan->id}/goals", ['goals' => [
        ['title' => 'Start one task with a five-minute timer', 'completed' => true],
        ['title' => 'Plan one pleasant activity', 'completed' => false],
    ]])->assertRedirect();
    expect($plan->fresh()->progress)->toBe(50);

    $this->put("/plans/{$plan->id}", structurePlanPayload($patient, ['title' => 'Updated care plan']))->assertRedirect();
    expect($plan->fresh()->title)->toBe('Updated care plan');
    $this->delete("/plans/{$plan->id}")->assertRedirect();
    $this->assertDatabaseMissing('treatment_plans', ['id' => $plan->id]);
});

test('a clinician can schedule document complete and delete a session', function () {
    $user = User::factory()->create();
    $patient = $user->patients()->create(structurePatientPayload());
    $user->treatmentPlans()->create([...structurePlanPayload($patient), 'goals' => [], 'interventions' => []]);
    $plan = TreatmentPlan::query()->sole();
    $this->actingAs($user);

    $this->post('/sessions', structureSessionPayload($patient, $plan))->assertRedirect();
    $session = TherapySession::query()->sole();
    $this->patch("/sessions/{$session->id}/complete")->assertRedirect();
    expect($session->fresh()->status)->toBe('completed');

    $this->put("/sessions/{$session->id}", structureSessionPayload($patient, $plan, ['status' => 'completed', 'notes' => 'A collaborative and useful conversation.']))->assertRedirect();
    expect($session->fresh()->notes)->toBe('A collaborative and useful conversation.');
    $this->delete("/sessions/{$session->id}")->assertRedirect();
    $this->assertDatabaseMissing('therapy_sessions', ['id' => $session->id]);
});

test('a clinician can record update and delete a wellbeing check in', function () {
    $user = User::factory()->create();
    $patient = $user->patients()->create(structurePatientPayload());
    $this->actingAs($user);
    $payload = ['patient_id' => $patient->id, 'checked_in_on' => today()->toDateString(), 'mood' => 6, 'energy' => 5, 'focus' => 7, 'sleep_hours' => 7.5, 'note' => 'A short walk helped.'];

    $this->post('/check-ins', $payload)->assertRedirect();
    $checkIn = CheckIn::query()->sole();
    $this->put("/check-ins/{$checkIn->id}", [...$payload, 'mood' => 7])->assertRedirect();
    expect($checkIn->fresh()->mood)->toBe(7);
    $this->delete("/check-ins/{$checkIn->id}")->assertRedirect();
    $this->assertDatabaseMissing('check_ins', ['id' => $checkIn->id]);
});

test('practice records cannot be viewed changed or removed by another clinician', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $patient = $owner->patients()->create(structurePatientPayload());
    $plan = $owner->treatmentPlans()->create([...structurePlanPayload($patient), 'goals' => [], 'interventions' => []]);
    $session = $owner->therapySessions()->create(structureSessionPayload($patient, $plan));
    $checkIn = $owner->checkIns()->create(['patient_id' => $patient->id, 'checked_in_on' => today(), 'mood' => 5, 'energy' => 5, 'focus' => 5]);
    $this->actingAs($otherUser);

    $this->get("/patients/{$patient->id}")->assertForbidden();
    $this->put("/patients/{$patient->id}", structurePatientPayload())->assertForbidden();
    $this->delete("/plans/{$plan->id}")->assertForbidden();
    $this->patch("/sessions/{$session->id}/complete")->assertForbidden();
    $this->delete("/check-ins/{$checkIn->id}")->assertForbidden();
    $this->post('/plans', structurePlanPayload($patient))->assertSessionHasErrors('patient_id');
});

test('the demo seeder creates a connected and usable practice', function () {
    $this->seed(DatabaseSeeder::class);

    expect(Patient::count())->toBe(8)
        ->and(TreatmentPlan::count())->toBe(8)
        ->and(TherapySession::count())->toBe(36)
        ->and(CheckIn::count())->toBeGreaterThan(70);

    $this->post('/login', ['email' => 'demo@structureplan.test', 'password' => 'password'])->assertRedirect('/dashboard');
    $this->get('/dashboard')->assertOk();
});
