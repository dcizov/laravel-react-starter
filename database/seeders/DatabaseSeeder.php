<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $user = User::create([
            'name' => 'Dr. Maya Chen',
            'email' => 'demo@structureplan.test',
            'password' => 'password',
            'email_verified_at' => now(),
        ]);

        $people = [
            ['Emma', 'Schneider', 'she/her', '1992-04-18', 'ADHD, combined presentation; moderate depressive episode', 'Integrated structure & mood recovery', 68, 'emmas'],
            ['Noah', 'Bennett', 'he/him', '1988-11-03', 'ADHD, inattentive presentation', 'Sustainable routines for work and home', 45, 'noahb'],
            ['Priya', 'Shah', 'she/her', '1996-02-21', 'Major depressive disorder, recurrent; ADHD traits', 'Behavioral activation & self-compassion', 74, 'priyas'],
            ['Lucas', 'Meyer', 'he/him', '2001-08-09', 'ADHD, combined presentation; adjustment difficulties', 'Study rhythms and emotional regulation', 32, 'lucasm'],
            ['Sofia', 'Rossi', 'she/her', '1985-06-14', 'Major depressive disorder, partial remission', 'Rebuilding energy and meaningful connection', 81, 'sofiar'],
            ['Ethan', 'Brooks', 'he/him', '1990-01-30', 'ADHD, predominantly hyperactive-impulsive; low mood', 'Impulse pause skills & restorative sleep', 56, 'ethanb'],
            ['Lena', 'Fischer', 'she/her', '1998-09-26', 'ADHD, inattentive presentation; persistent depressive disorder', 'Gentle structure and values-led action', 63, 'lenaf'],
            ['Oliver', 'Grant', 'he/him', '1979-12-05', 'Major depressive disorder, recurrent', 'Relapse prevention and daily anchors', 88, 'oliverg'],
        ];

        $goalSets = [
            ['Use a five-minute start ritual on four workdays', 'Schedule one enjoyable activity each weekend', 'Practice a compassionate thought record twice weekly'],
            ['Prepare a next-day launch pad each evening', 'Take a movement break between focused work blocks', 'Use a visual timer for three priority tasks'],
            ['Take a ten-minute morning walk three times weekly', 'Contact one supportive person each week', 'Notice and record one daily moment of mastery'],
            ['Begin studying with a two-minute starter task', 'Keep phone outside the study area', 'Use a brief grounding exercise before exams'],
            ['Plan one low-energy pleasant activity daily', 'Eat lunch away from the work desk', 'Attend one social or community activity weekly'],
            ['Pause and name the urge before acting', 'Keep a consistent wind-down routine', 'Use a written priority list before opening email'],
            ['Choose one small values-led action each morning', 'Externalize appointments in one calendar', 'Challenge all-or-nothing thoughts with evidence'],
            ['Maintain regular morning light and movement', 'Review early-warning signs each Sunday', 'Schedule two connection points each week'],
        ];

        /** @var Collection<int, Patient> $patients */
        $patients = collect();
        foreach ($people as $index => $person) {
            [$first, $last, $pronouns, $birthDate, $diagnoses, $planTitle, $progress, $email] = $person;
            $patient = $user->patients()->create([
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email.'@example.test',
                'phone' => '+49 151 '.str_pad((string) (21000000 + $index * 1739), 8, '0', STR_PAD_LEFT),
                'date_of_birth' => $birthDate,
                'pronouns' => $pronouns,
                'diagnoses' => $diagnoses,
                'status' => 'active',
                'risk_level' => in_array($index, [2, 5]) ? 'moderate' : 'low',
                'notes' => [
                    'Responds well to visual planning and short, concrete between-session experiments.',
                    'Work demands are a key trigger; strengths include humor and strong reflective capacity.',
                    'Values creativity and connection. Monitor sleep and withdrawal when mood dips.',
                    'Currently balancing university deadlines; prefers collaborative, flexible goals.',
                    'Enjoys gardening and cooking. Focus on pacing rather than productivity pressure.',
                    'Regular exercise is protective. Sleep routine remains a useful intervention target.',
                    'Strong artistic interests; benefits from reducing task initiation friction.',
                    'Stable routines established; currently consolidating relapse-prevention skills.',
                ][$index],
                'emergency_contact' => ['Jonas Schneider', 'Maya Bennett', 'Anika Shah', 'Clara Meyer', 'Marco Rossi', 'Alice Brooks', 'Tim Fischer', 'Nora Grant'][$index].' · +49 151 5550 10'.$index,
                'created_at' => now()->subMonths(8 - $index),
            ]);
            $patients->push($patient);

            $goals = collect($goalSets[$index])->map(fn (string $title, int $goalIndex) => [
                'title' => $title,
                'completed' => $goalIndex === 0 || ($progress > 70 && $goalIndex === 1),
            ])->values()->all();

            $user->treatmentPlans()->create([
                'patient_id' => $patient->id,
                'title' => $planTitle,
                'focus' => str_contains(strtolower($diagnoses), 'adhd') && str_contains(strtolower($diagnoses), 'depress') ? 'integrated' : (str_contains(strtolower($diagnoses), 'adhd') ? 'adhd' : 'depression'),
                'status' => 'active',
                'start_date' => now()->subWeeks(10 - $index)->startOfWeek(),
                'review_date' => now()->addDays(4 + ($index * 6)),
                'progress' => $progress,
                'goals' => $goals,
                'interventions' => [
                    'Collaborative agenda setting and SMART goal review',
                    str_contains(strtolower($diagnoses), 'adhd') ? 'External scaffolding, time-boxing and task breakdown' : 'Behavioral activation and pleasant-event scheduling',
                    'Brief mood, sleep and functioning check-ins',
                ],
                'notes' => 'Review goals collaboratively and adjust pacing to current capacity. Progress is not expected to be linear.',
            ]);
        }

        $sessionNotes = [
            'Reviewed weekly rhythms and identified one manageable adjustment. Patient engaged well and helped shape the next experiment.',
            'Explored recent stressors with a focus on self-criticism. Practiced reframing and agreed on a small values-based action.',
            'Used a visual timeline to reduce overwhelm. Broke the next task into a ten-minute starting step.',
            'Mood remains variable with some brighter periods. Reinforced pacing, connection and realistic expectations.',
        ];

        foreach ($patients as $index => $patient) {
            $plan = $patient->treatmentPlans()->first();
            foreach ([21, 14, 7] as $sessionIndex => $daysAgo) {
                $user->therapySessions()->create([
                    'patient_id' => $patient->id,
                    'treatment_plan_id' => $plan?->id,
                    'scheduled_at' => now()->subDays($daysAgo)->setTime(9 + ($index % 5), 0),
                    'duration' => 50,
                    'type' => $daysAgo === 21 ? 'follow_up' : 'individual',
                    'status' => 'completed',
                    'location' => $index % 3 === 0 ? 'in_person' : 'video',
                    'mood_before' => 4 + ($index % 3),
                    'mood_after' => 6 + ($index % 2),
                    'notes' => $sessionNotes[($index + $sessionIndex) % count($sessionNotes)],
                    'homework' => $goalSets[$index][$sessionIndex].'. Notice what helps, without aiming for perfection.',
                ]);
            }

            $user->therapySessions()->create([
                'patient_id' => $patient->id,
                'treatment_plan_id' => $plan?->id,
                'scheduled_at' => now()->addDays(2 + $index)->setTime(10 + ($index % 4), 0),
                'duration' => 50,
                'type' => $index === 7 ? 'plan_review' : 'individual',
                'status' => 'scheduled',
                'location' => $index % 2 === 0 ? 'video' : 'in_person',
                'notes' => null,
                'homework' => null,
            ]);
        }

        $todayTimes = ['09:00', '11:00', '14:30', '16:00'];
        foreach ($patients->take(4) as $index => $patient) {
            [$hour, $minute] = array_map('intval', explode(':', $todayTimes[$index]));
            $user->therapySessions()->create([
                'patient_id' => $patient->id,
                'treatment_plan_id' => $patient->treatmentPlans()->first()?->id,
                'scheduled_at' => today()->setTime($hour, $minute),
                'duration' => $index === 2 ? 45 : 50,
                'type' => $index === 2 ? 'plan_review' : 'individual',
                'status' => $index === 0 ? 'completed' : 'scheduled',
                'location' => $index % 2 === 0 ? 'video' : 'in_person',
                'mood_before' => $index === 0 ? 5 : null,
                'mood_after' => $index === 0 ? 7 : null,
                'notes' => $index === 0 ? 'Reviewed morning structure and celebrated two weeks of consistent planning. Agreed to keep the experiment small.' : null,
                'homework' => $index === 0 ? 'Use the same five-minute start ritual on Monday, Tuesday and Thursday.' : null,
            ]);
        }

        $checkInNotes = [
            'A little overwhelmed in the morning, but the short walk helped.',
            'Started one important task before checking messages.',
            'Lower energy today. Used the simplified version of my plan.',
            'Felt more settled after speaking with a friend.',
            'Sleep was restless; keeping today intentionally light.',
            'Good focus during the timed work block.',
        ];

        foreach ($patients as $patientIndex => $patient) {
            foreach (range(13, 0) as $daysAgo) {
                if (($daysAgo + $patientIndex) % 4 === 0 && $daysAgo !== 0) {
                    continue;
                }
                $wave = (13 - $daysAgo) / 7;
                $mood = max(3, min(9, (int) round(4 + ($patientIndex % 3) + $wave + (($daysAgo + $patientIndex) % 3 - 1) * 0.5)));
                $user->checkIns()->create([
                    'patient_id' => $patient->id,
                    'checked_in_on' => today()->subDays($daysAgo),
                    'mood' => $mood,
                    'energy' => max(2, min(9, $mood - 1 + (($daysAgo + $patientIndex) % 3))),
                    'focus' => max(2, min(9, $mood - 2 + ($patientIndex % 3))),
                    'sleep_hours' => 5.8 + (($patientIndex + $daysAgo) % 5) * 0.5,
                    'note' => $daysAgo % 3 === 0 ? $checkInNotes[($patientIndex + $daysAgo) % count($checkInNotes)] : null,
                    'created_at' => today()->subDays($daysAgo)->setTime(8 + ($patientIndex % 4), 15),
                ]);
            }
        }
    }
}
