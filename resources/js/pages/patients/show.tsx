import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Check,
    ChevronRight,
    ClipboardList,
    FileText,
    Mail,
    Pencil,
    Phone,
    Plus,
    ShieldAlert,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { CheckInFormDialog } from '@/components/forms/check-in-form';
import { PatientFormDialog } from '@/components/forms/patient-form';
import { PlanFormDialog } from '@/components/forms/plan-form';
import { SessionFormDialog } from '@/components/forms/session-form';
import { PatientAvatar } from '@/components/patient-avatar';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime, relativeDate, titleCase } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Patient, TreatmentPlan } from '@/types';

export default function PatientShow({ patient }: { patient: Patient }) {
    const [plans, setPlans] = useState(patient.treatment_plans ?? []);
    const [patientFormOpen, setPatientFormOpen] = useState(false);
    const [planFormOpen, setPlanFormOpen] = useState(false);
    const [sessionFormOpen, setSessionFormOpen] = useState(false);
    const [checkInFormOpen, setCheckInFormOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null);
    useEffect(
        () => setPlans(patient.treatment_plans ?? []),
        [patient.treatment_plans],
    );
    const sessions = patient.sessions ?? [];
    const checkIns = patient.check_ins ?? [];
    const activePlan =
        plans.find((plan) => plan.status === 'active') ?? plans[0];
    const latestCheckIn = checkIns[0];
    const nextSession = useMemo(
        () =>
            sessions
                .filter(
                    (session) =>
                        session.status === 'scheduled' &&
                        new Date(session.scheduled_at) >= new Date(),
                )
                .sort(
                    (a, b) =>
                        new Date(a.scheduled_at).getTime() -
                        new Date(b.scheduled_at).getTime(),
                )[0],
        [sessions],
    );
    const age = patient.date_of_birth
        ? Math.floor(
              (Date.now() -
                  new Date(`${patient.date_of_birth}T12:00:00`).getTime()) /
                  31_557_600_000,
          )
        : null;
    const patientOption = [{ id: patient.id, name: patient.name }];

    const editPlan = (plan: TreatmentPlan) => {
        setEditingPlan(plan);
        setPlanFormOpen(true);
    };
    const openNewPlan = () => {
        setEditingPlan(null);
        setPlanFormOpen(true);
    };
    const toggleGoal = (index: number) => {
        if (!activePlan) return;
        const previous = plans;
        const goals = activePlan.goals.map((goal, goalIndex) =>
            goalIndex === index
                ? { ...goal, completed: !goal.completed }
                : goal,
        );
        const progress = goals.length
            ? Math.round(
                  (goals.filter((goal) => goal.completed).length /
                      goals.length) *
                      100,
              )
            : 0;
        setPlans((items) =>
            items.map((plan) =>
                plan.id === activePlan.id ? { ...plan, goals, progress } : plan,
            ),
        );
        router.patch(
            `/plans/${activePlan.id}/goals`,
            { goals },
            { preserveScroll: true, onError: () => setPlans(previous) },
        );
    };

    return (
        <>
            <Head title={patient.name} />
            <Link
                href="/patients"
                className="mb-5 inline-flex items-center gap-2 text-[11px] font-medium text-[#7c8b80] transition hover:text-[#365445]"
            >
                <ArrowLeft className="size-3.5" /> Back to patients
            </Link>
            <section className="mb-6 overflow-hidden rounded-2xl border border-[#e1e6dd] bg-white shadow-[0_1px_2px_rgba(32,61,52,.025)]">
                <div className="relative p-5 sm:p-7">
                    <div className="absolute top-0 right-0 size-44 rounded-bl-full bg-[#f4f6f0]/80" />
                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                        <PatientAvatar
                            initials={patient.initials}
                            id={patient.id}
                            className="size-16 rounded-2xl text-lg sm:size-[72px]"
                        />
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#29473a] sm:text-[32px]">
                                    {patient.name}
                                </h1>
                                <StatusBadge status={patient.status} />
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#859188]">
                                <span>
                                    {patient.pronouns || 'Pronouns not set'}
                                </span>
                                {age !== null && (
                                    <>
                                        <span className="size-0.5 rounded-full bg-[#b6bfb7]" />
                                        <span>{age} years old</span>
                                    </>
                                )}
                                <span className="size-0.5 rounded-full bg-[#b6bfb7]" />
                                <span>
                                    Patient since{' '}
                                    {formatDate(patient.created_at, {
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>
                            <p className="mt-3 max-w-2xl text-xs leading-5 text-[#6e7f73]">
                                {patient.diagnoses}
                            </p>
                        </div>
                        <div className="relative flex shrink-0 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setPatientFormOpen(true)}
                                className="rounded-xl border-[#dce3d8] bg-white text-xs text-[#50675a]"
                            >
                                <Pencil />{' '}
                                <span className="hidden sm:inline">
                                    Edit details
                                </span>
                            </Button>
                            <Button
                                onClick={() => setSessionFormOpen(true)}
                                className="rounded-xl bg-[#214d40] text-xs text-white hover:bg-[#193f34]"
                            >
                                <Plus /> Schedule session
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 border-t border-[#e8ece5] bg-[#fbfcfa] lg:grid-cols-4">
                    <div className="border-r border-[#e8ece5] p-4 sm:px-6">
                        <div className="text-[9px] font-semibold tracking-[0.08em] text-[#9aa49b] uppercase">
                            Sessions together
                        </div>
                        <div className="mt-1.5 text-sm font-semibold text-[#496052]">
                            {
                                sessions.filter((s) => s.status === 'completed')
                                    .length
                            }{' '}
                            completed
                        </div>
                    </div>
                    <div className="p-4 sm:px-6 lg:border-r lg:border-[#e8ece5]">
                        <div className="text-[9px] font-semibold tracking-[0.08em] text-[#9aa49b] uppercase">
                            Next session
                        </div>
                        <div className="mt-1.5 truncate text-sm font-semibold text-[#496052]">
                            {nextSession
                                ? `${formatDate(nextSession.scheduled_at, { month: 'short', day: 'numeric' })}, ${formatTime(nextSession.scheduled_at)}`
                                : 'Not scheduled'}
                        </div>
                    </div>
                    <div className="border-t border-r border-[#e8ece5] p-4 sm:px-6 lg:border-t-0">
                        <div className="text-[9px] font-semibold tracking-[0.08em] text-[#9aa49b] uppercase">
                            Last check-in
                        </div>
                        <div className="mt-1.5 text-sm font-semibold text-[#496052]">
                            {relativeDate(latestCheckIn?.checked_in_on ?? null)}
                        </div>
                    </div>
                    <div className="border-t border-[#e8ece5] p-4 sm:px-6 lg:border-t-0">
                        <div className="text-[9px] font-semibold tracking-[0.08em] text-[#9aa49b] uppercase">
                            Current risk
                        </div>
                        <div className="mt-1.5">
                            <StatusBadge status={patient.risk_level} />
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.8fr)]">
                <div className="space-y-6">
                    <section className="rounded-2xl border border-[#e3e7df] bg-white p-5 shadow-[0_1px_2px_rgba(32,61,52,.025)] sm:p-6">
                        <div className="mb-6 flex items-start justify-between gap-3">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-[0.1em] text-[#8b998e] uppercase">
                                    <ClipboardList className="size-3.5" />{' '}
                                    Active treatment plan
                                </div>
                                <h2 className="text-lg font-semibold tracking-[-0.025em] text-[#314d40]">
                                    {activePlan?.title ?? 'No active care plan'}
                                </h2>
                                {activePlan && (
                                    <p className="mt-1.5 text-[11px] text-[#929d94]">
                                        Started{' '}
                                        {formatDate(activePlan.start_date)} ·
                                        Review{' '}
                                        {formatDate(activePlan.review_date)}
                                    </p>
                                )}
                            </div>
                            {activePlan && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => editPlan(activePlan)}
                                    className="rounded-xl border-[#dfe5db] text-[10px] text-[#637768]"
                                >
                                    <Pencil /> Edit plan
                                </Button>
                            )}
                        </div>
                        {activePlan ? (
                            <>
                                <div className="mb-6 rounded-2xl bg-[#f3f6ef] p-4">
                                    <div className="mb-2 flex items-center justify-between text-[11px]">
                                        <span className="text-[#748477]">
                                            Overall progress
                                        </span>
                                        <span className="font-semibold text-[#55725b]">
                                            {activePlan.progress}%
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-[#e2e8dc]">
                                        <div
                                            className="h-full rounded-full bg-[#819b7b] transition-all duration-500"
                                            style={{
                                                width: `${activePlan.progress}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div>
                                        <h3 className="mb-3 text-[11px] font-semibold text-[#52695a]">
                                            Shared goals
                                        </h3>
                                        <div className="space-y-3">
                                            {activePlan.goals.map(
                                                (goal, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() =>
                                                            toggleGoal(index)
                                                        }
                                                        className="flex w-full items-start gap-2.5 text-left"
                                                    >
                                                        <span
                                                            className={cn(
                                                                'mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border transition',
                                                                goal.completed
                                                                    ? 'border-[#7f9a7e] bg-[#7f9a7e] text-white'
                                                                    : 'border-[#cfd7cb] text-transparent hover:border-[#8ba18a]',
                                                            )}
                                                        >
                                                            <Check
                                                                className="size-2.5"
                                                                strokeWidth={3}
                                                            />
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                'text-[11px] leading-5',
                                                                goal.completed
                                                                    ? 'text-[#9da79e] line-through'
                                                                    : 'text-[#65776a]',
                                                            )}
                                                        >
                                                            {goal.title}
                                                        </span>
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="mb-3 text-[11px] font-semibold text-[#52695a]">
                                            Helpful approaches
                                        </h3>
                                        <div className="space-y-3">
                                            {activePlan.interventions.map(
                                                (item, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-start gap-2.5 text-[11px] leading-5 text-[#718076]"
                                                    >
                                                        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#96aa8d]" />
                                                        {item}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {activePlan.notes && (
                                    <div className="mt-6 border-t border-[#edf0ea] pt-4 text-[10px] leading-5 text-[#8a968c]">
                                        {activePlan.notes}
                                    </div>
                                )}
                            </>
                        ) : (
                            <EmptyState
                                icon={ClipboardList}
                                title="A plan made together"
                                description="Create shared goals and choose approaches that fit this person’s life."
                                action={
                                    <Button
                                        onClick={openNewPlan}
                                        className="rounded-xl bg-[#214d40] text-white"
                                    >
                                        <Plus /> Create care plan
                                    </Button>
                                }
                            />
                        )}
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-[#e3e7df] bg-white shadow-[0_1px_2px_rgba(32,61,52,.025)]">
                        <div className="flex items-center justify-between border-b border-[#edf0ea] px-5 py-4 sm:px-6">
                            <div>
                                <h2 className="text-sm font-semibold text-[#2d493e]">
                                    Session timeline
                                </h2>
                                <p className="mt-1 text-[10px] text-[#96a198]">
                                    The ongoing story, in one place
                                </p>
                            </div>
                            <Link
                                href={`/sessions?patient=${patient.id}`}
                                className="flex items-center gap-1 text-[10px] font-medium text-[#6c856f]"
                            >
                                Manage sessions{' '}
                                <ChevronRight className="size-3" />
                            </Link>
                        </div>
                        {sessions.length === 0 ? (
                            <EmptyState
                                icon={CalendarDays}
                                title="No sessions recorded"
                                description="Schedule the first session to begin this timeline."
                                action={
                                    <Button
                                        onClick={() => setSessionFormOpen(true)}
                                        variant="outline"
                                        className="rounded-xl"
                                    >
                                        Schedule session
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="divide-y divide-[#edf0ea]">
                                {sessions.slice(0, 5).map((session) => (
                                    <div
                                        key={session.id}
                                        className="flex gap-4 px-5 py-5 sm:px-6"
                                    >
                                        <div
                                            className={cn(
                                                'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
                                                session.status === 'completed'
                                                    ? 'bg-[#eaf0e5] text-[#6d886e]'
                                                    : 'bg-[#e9eef2] text-[#6c8493]',
                                            )}
                                        >
                                            {session.status === 'completed' ? (
                                                <FileText className="size-4" />
                                            ) : (
                                                <CalendarDays className="size-4" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <span className="text-xs font-semibold text-[#435d4e]">
                                                        {titleCase(
                                                            session.type,
                                                        )}
                                                    </span>
                                                    <span className="ml-2 text-[10px] text-[#96a198]">
                                                        {formatDate(
                                                            session.scheduled_at,
                                                            {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            },
                                                        )}{' '}
                                                        ·{' '}
                                                        {formatTime(
                                                            session.scheduled_at,
                                                        )}
                                                    </span>
                                                </div>
                                                <StatusBadge
                                                    status={session.status}
                                                />
                                            </div>
                                            {session.notes ? (
                                                <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#7b8980]">
                                                    {session.notes}
                                                </p>
                                            ) : (
                                                <p className="mt-2 text-[10px] text-[#a0a9a1]">
                                                    {session.duration} minutes ·{' '}
                                                    {session.location ===
                                                    'in_person'
                                                        ? 'In person'
                                                        : titleCase(
                                                              session.location,
                                                          )}
                                                </p>
                                            )}
                                            {session.homework && (
                                                <div className="mt-3 rounded-xl bg-[#f2f5ee] px-3 py-2.5 text-[10px] leading-4 text-[#748575]">
                                                    <span className="font-semibold text-[#5c745f]">
                                                        Next step:
                                                    </span>{' '}
                                                    {session.homework}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {sessions.length > 5 && (
                            <Link
                                href="/sessions"
                                className="flex items-center justify-center gap-2 border-t border-[#edf0ea] py-3 text-[10px] font-medium text-[#748b78]"
                            >
                                View all {sessions.length} sessions{' '}
                                <ArrowRight className="size-3" />
                            </Link>
                        )}
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="rounded-2xl border border-[#e3e7df] bg-white p-5 shadow-[0_1px_2px_rgba(32,61,52,.025)]">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-[#2d493e]">
                                    Wellbeing snapshot
                                </h2>
                                <p className="mt-1 text-[10px] text-[#96a198]">
                                    {latestCheckIn
                                        ? `Last entry ${relativeDate(latestCheckIn.checked_in_on).toLowerCase()}`
                                        : 'No entries yet'}
                                </p>
                            </div>
                            <div className="flex size-8 items-center justify-center rounded-xl bg-[#edf2e9] text-[#728c71]">
                                <Activity className="size-4" />
                            </div>
                        </div>
                        {latestCheckIn ? (
                            <>
                                <div className="space-y-4">
                                    {[
                                        ['Mood', latestCheckIn.mood, '#bf8169'],
                                        [
                                            'Energy',
                                            latestCheckIn.energy,
                                            '#809976',
                                        ],
                                        [
                                            'Focus',
                                            latestCheckIn.focus,
                                            '#7890a0',
                                        ],
                                    ].map(([label, value, color]) => (
                                        <div key={label as string}>
                                            <div className="mb-1.5 flex items-center justify-between text-[10px]">
                                                <span className="text-[#7f8d82]">
                                                    {label as string}
                                                </span>
                                                <span className="font-semibold text-[#5b7160]">
                                                    {value as number}/10
                                                </span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-[#edf0e9]">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${(value as number) * 10}%`,
                                                        backgroundColor:
                                                            color as string,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {latestCheckIn.note && (
                                    <p className="mt-5 rounded-xl bg-[#f5f6f2] p-3 text-[10px] leading-5 text-[#7b897f]">
                                        “{latestCheckIn.note}”
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="py-4 text-center text-[11px] leading-5 text-[#98a199]">
                                Check-ins add everyday context between
                                appointments.
                            </p>
                        )}
                        <div className="mt-5 flex gap-2">
                            <Button
                                onClick={() => setCheckInFormOpen(true)}
                                variant="outline"
                                size="sm"
                                className="flex-1 rounded-xl border-[#dfe5db] text-[10px] text-[#64796a]"
                            >
                                <Plus /> Add check-in
                            </Button>
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="rounded-xl text-[10px] text-[#728a75]"
                            >
                                <Link href={`/check-ins?patient=${patient.id}`}>
                                    View all <ChevronRight />
                                </Link>
                            </Button>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-[#e3e7df] bg-white p-5">
                        <h2 className="mb-4 text-sm font-semibold text-[#2d493e]">
                            Contact & context
                        </h2>
                        <div className="space-y-3">
                            {patient.email && (
                                <a
                                    href={`mailto:${patient.email}`}
                                    className="flex items-center gap-3 text-[11px] text-[#718177] hover:text-[#365445]"
                                >
                                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#f1f4ee] text-[#81917f]">
                                        <Mail className="size-3.5" />
                                    </span>
                                    <span className="truncate">
                                        {patient.email}
                                    </span>
                                </a>
                            )}
                            {patient.phone && (
                                <a
                                    href={`tel:${patient.phone}`}
                                    className="flex items-center gap-3 text-[11px] text-[#718177] hover:text-[#365445]"
                                >
                                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#f1f4ee] text-[#81917f]">
                                        <Phone className="size-3.5" />
                                    </span>
                                    {patient.phone}
                                </a>
                            )}
                            {patient.date_of_birth && (
                                <div className="flex items-center gap-3 text-[11px] text-[#718177]">
                                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#f1f4ee] text-[#81917f]">
                                        <UserRound className="size-3.5" />
                                    </span>
                                    Born {formatDate(patient.date_of_birth)}
                                </div>
                            )}
                            {patient.emergency_contact && (
                                <div className="flex items-start gap-3 text-[11px] leading-5 text-[#718177]">
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f5eee7] text-[#a18062]">
                                        <ShieldAlert className="size-3.5" />
                                    </span>
                                    <span>
                                        <span className="block text-[9px] text-[#9a958b]">
                                            Emergency contact
                                        </span>
                                        {patient.emergency_contact}
                                    </span>
                                </div>
                            )}
                        </div>
                        {patient.notes && (
                            <div className="mt-5 border-t border-[#edf0ea] pt-4">
                                <h3 className="mb-2 text-[10px] font-semibold text-[#607466]">
                                    Clinical context & strengths
                                </h3>
                                <p className="text-[10px] leading-5 text-[#849087]">
                                    {patient.notes}
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
            <PatientFormDialog
                open={patientFormOpen}
                onOpenChange={setPatientFormOpen}
                patient={patient}
            />
            <PlanFormDialog
                open={planFormOpen}
                onOpenChange={setPlanFormOpen}
                plan={editingPlan}
                patients={patientOption}
                patientId={patient.id}
            />
            <SessionFormDialog
                open={sessionFormOpen}
                onOpenChange={setSessionFormOpen}
                patients={patientOption}
                plans={plans.map((plan) => ({
                    id: plan.id,
                    patient_id: plan.patient_id,
                    title: plan.title,
                }))}
                patientId={patient.id}
            />
            <CheckInFormDialog
                open={checkInFormOpen}
                onOpenChange={setCheckInFormOpen}
                patients={patientOption}
                patientId={patient.id}
            />
        </>
    );
}
