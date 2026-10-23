import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    Battery,
    Brain,
    Moon,
    MoreHorizontal,
    Pencil,
    Plus,
    Smile,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { CheckInFormDialog } from '@/components/forms/check-in-form';
import { PageHeader } from '@/components/page-header';
import { PatientAvatar } from '@/components/patient-avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WellbeingChart } from '@/components/wellbeing-chart';
import { formatDate, relativeDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { CheckIn, PatientOption, TrendPoint } from '@/types';

function average(values: number[]) {
    return values.length
        ? Math.round(
              (values.reduce((sum, value) => sum + value, 0) / values.length) *
                  10,
          ) / 10
        : null;
}

export default function CheckInsIndex({
    checkIns: initialCheckIns,
    patients,
}: {
    checkIns: CheckIn[];
    patients: PatientOption[];
}) {
    const params =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();
    const [checkIns, setCheckIns] = useState(initialCheckIns);
    const [patientFilter, setPatientFilter] = useState(
        params.get('patient') ?? 'all',
    );
    const [metric, setMetric] = useState<'mood' | 'energy'>('mood');
    const [formOpen, setFormOpen] = useState(params.get('create') === '1');
    const [editing, setEditing] = useState<CheckIn | null>(null);
    const [deleting, setDeleting] = useState<CheckIn | null>(null);
    const patientId = params.get('patient')
        ? Number(params.get('patient'))
        : undefined;
    useEffect(() => setCheckIns(initialCheckIns), [initialCheckIns]);

    const filtered = useMemo(
        () =>
            checkIns.filter(
                (item) =>
                    patientFilter === 'all' ||
                    String(item.patient_id) === patientFilter,
            ),
        [checkIns, patientFilter],
    );
    const trend = useMemo<TrendPoint[]>(
        () =>
            Array.from({ length: 7 }, (_, index) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - index));
                const key = date.toISOString().slice(0, 10);
                const entries = filtered.filter(
                    (item) => item.checked_in_on === key,
                );
                return {
                    date: key,
                    label: new Intl.DateTimeFormat('en-US', {
                        weekday: 'short',
                    }).format(date),
                    mood: average(entries.map((item) => item.mood)),
                    energy: average(entries.map((item) => item.energy)),
                };
            }),
        [filtered],
    );
    const recent = useMemo(
        () =>
            filtered.filter((item) =>
                trend.some((point) => point.date === item.checked_in_on),
            ),
        [filtered, trend],
    );
    const averages = {
        mood: average(recent.map((item) => item.mood)),
        energy: average(recent.map((item) => item.energy)),
        focus: average(recent.map((item) => item.focus)),
        sleep: average(
            recent
                .map((item) => item.sleep_hours)
                .filter((value): value is number => value !== null),
        ),
    };
    const openNew = () => {
        setEditing(null);
        setFormOpen(true);
    };
    const edit = (checkIn: CheckIn) => {
        setEditing(checkIn);
        setFormOpen(true);
    };
    const remove = () => {
        if (!deleting) return;
        const previous = checkIns;
        setCheckIns((items) => items.filter((item) => item.id !== deleting.id));
        router.delete(`/check-ins/${deleting.id}`, {
            preserveScroll: true,
            onError: () => setCheckIns(previous),
            onSuccess: () => setDeleting(null),
        });
    };

    return (
        <>
            <Head title="Check-ins" />
            <PageHeader
                eyebrow="Everyday wellbeing"
                title="Check-ins"
                description="Notice patterns in mood, energy, focus, and sleep—gentle context for the next conversation, never a standalone diagnosis."
                actions={
                    <Button
                        onClick={openNew}
                        className="rounded-xl bg-[#214d40] text-xs text-white hover:bg-[#193f34]"
                    >
                        <Plus /> Record check-in
                    </Button>
                }
            />
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-[#7f8c82]">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-[#e7eee2] text-[#6c866d]">
                        <Activity className="size-4" />
                    </span>
                    <span>
                        <strong className="font-semibold text-[#4b6353]">
                            {recent.length} check-ins
                        </strong>{' '}
                        in the last 7 days
                    </span>
                </div>
                <select
                    value={patientFilter}
                    onChange={(e) => setPatientFilter(e.target.value)}
                    className="h-10 rounded-xl border border-[#e0e6dc] bg-white px-3 text-xs text-[#617267] outline-none sm:w-56"
                    aria-label="Filter check-ins by patient"
                >
                    <option value="all">All active patients</option>
                    {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                            {patient.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-6 grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.8fr)]">
                <section className="rounded-2xl border border-[#e3e7df] bg-white p-5 shadow-[0_1px_2px_rgba(32,61,52,.025)] sm:p-6">
                    <div className="mb-2 flex items-start justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-[#2d493e]">
                                Seven-day pattern
                            </h2>
                            <p className="mt-1 text-[11px] text-[#919c93]">
                                Averages from recorded check-ins
                            </p>
                        </div>
                        <div className="flex rounded-lg bg-[#f1f3ee] p-0.5">
                            {(['mood', 'energy'] as const).map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setMetric(item)}
                                    className={cn(
                                        'rounded-md px-3 py-1.5 text-[10px] font-medium capitalize transition',
                                        metric === item
                                            ? 'bg-white text-[#496151] shadow-sm'
                                            : 'text-[#929d94]',
                                    )}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                    <WellbeingChart data={trend} metric={metric} height={200} />
                </section>
                <section className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-[#e4e7e0] bg-white p-5">
                        <div className="mb-4 flex size-9 items-center justify-center rounded-xl bg-[#f3e7e1] text-[#b07863]">
                            <Smile className="size-4" />
                        </div>
                        <div className="text-2xl font-semibold tracking-[-0.04em] text-[#385246]">
                            {averages.mood ?? '—'}
                            <span className="text-xs font-normal text-[#9aa49b]">
                                /10
                            </span>
                        </div>
                        <div className="mt-1 text-[11px] text-[#8a968c]">
                            Average mood
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[#e4e7e0] bg-white p-5">
                        <div className="mb-4 flex size-9 items-center justify-center rounded-xl bg-[#e8efe3] text-[#70896c]">
                            <Battery className="size-4" />
                        </div>
                        <div className="text-2xl font-semibold tracking-[-0.04em] text-[#385246]">
                            {averages.energy ?? '—'}
                            <span className="text-xs font-normal text-[#9aa49b]">
                                /10
                            </span>
                        </div>
                        <div className="mt-1 text-[11px] text-[#8a968c]">
                            Average energy
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[#e4e7e0] bg-white p-5">
                        <div className="mb-4 flex size-9 items-center justify-center rounded-xl bg-[#e8edf1] text-[#657f90]">
                            <Brain className="size-4" />
                        </div>
                        <div className="text-2xl font-semibold tracking-[-0.04em] text-[#385246]">
                            {averages.focus ?? '—'}
                            <span className="text-xs font-normal text-[#9aa49b]">
                                /10
                            </span>
                        </div>
                        <div className="mt-1 text-[11px] text-[#8a968c]">
                            Average focus
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[#e4e7e0] bg-white p-5">
                        <div className="mb-4 flex size-9 items-center justify-center rounded-xl bg-[#eeeaf2] text-[#7d708b]">
                            <Moon className="size-4" />
                        </div>
                        <div className="text-2xl font-semibold tracking-[-0.04em] text-[#385246]">
                            {averages.sleep ?? '—'}
                            <span className="text-xs font-normal text-[#9aa49b]">
                                h
                            </span>
                        </div>
                        <div className="mt-1 text-[11px] text-[#8a968c]">
                            Average sleep
                        </div>
                    </div>
                </section>
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#e3e7df] bg-white shadow-[0_1px_2px_rgba(32,61,52,.025)]">
                <div className="flex items-center justify-between border-b border-[#edf0ea] px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="text-xs font-semibold text-[#405a4b]">
                            Recent entries
                        </h2>
                        <p className="mt-1 text-[10px] text-[#97a198]">
                            {filtered.length} total check-ins
                        </p>
                    </div>
                    <Activity className="size-4 text-[#9aa59b]" />
                </div>
                {filtered.length === 0 ? (
                    <EmptyState
                        icon={Activity}
                        title="No check-ins here yet"
                        description="Record a check-in to start noticing everyday patterns over time."
                        action={
                            <Button
                                onClick={openNew}
                                className="rounded-xl bg-[#214d40] text-white"
                            >
                                <Plus /> Record check-in
                            </Button>
                        }
                    />
                ) : (
                    <div className="divide-y divide-[#edf0ea]">
                        {filtered.slice(0, 30).map((checkIn) => (
                            <div
                                key={checkIn.id}
                                className="flex items-center gap-3 px-4 py-4 transition hover:bg-[#fbfcfa] sm:gap-4 sm:px-6"
                            >
                                <PatientAvatar
                                    initials={checkIn.patient?.initials ?? '??'}
                                    id={checkIn.patient_id}
                                    className="size-9"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2">
                                        <Link
                                            href={`/patients/${checkIn.patient_id}`}
                                            className="text-xs font-semibold text-[#3c5648] hover:text-[#6a846d]"
                                        >
                                            {checkIn.patient?.name}
                                        </Link>
                                        <span className="text-[9px] text-[#a0a9a1]">
                                            ·{' '}
                                            {relativeDate(
                                                checkIn.checked_in_on,
                                            )}
                                        </span>
                                    </div>
                                    <p className="mt-1 truncate text-[10px] text-[#929d94]">
                                        {checkIn.note ||
                                            `Sleep ${checkIn.sleep_hours ?? '—'}h · No additional note`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    {[
                                        [
                                            Smile,
                                            checkIn.mood,
                                            'bg-[#f5ebe6] text-[#a87561]',
                                        ],
                                        [
                                            Battery,
                                            checkIn.energy,
                                            'bg-[#edf2e9] text-[#6f886c]',
                                        ],
                                        [
                                            Brain,
                                            checkIn.focus,
                                            'bg-[#ebf0f3] text-[#6c8392]',
                                        ],
                                    ].map(([Icon, value, color], index) => {
                                        const ScoreIcon = Icon as typeof Smile;
                                        return (
                                            <div
                                                key={index}
                                                className={cn(
                                                    'flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold',
                                                    color as string,
                                                )}
                                                title={
                                                    ['Mood', 'Energy', 'Focus'][
                                                        index
                                                    ]
                                                }
                                            >
                                                <ScoreIcon className="hidden size-3 sm:block" />
                                                {value as number}
                                            </div>
                                        );
                                    })}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className="rounded-lg p-1.5 text-[#98a299] hover:bg-[#edf1ea]"
                                            aria-label="Check-in actions"
                                        >
                                            <MoreHorizontal className="size-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-40 rounded-xl bg-white"
                                    >
                                        <DropdownMenuItem
                                            onClick={() => edit(checkIn)}
                                            className="cursor-pointer"
                                        >
                                            <Pencil /> Edit entry
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setDeleting(checkIn)}
                                            className="cursor-pointer text-[#a35e54] focus:text-[#a35e54]"
                                        >
                                            <Trash2 /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                )}
                {filtered.length > 30 && (
                    <div className="border-t border-[#edf0ea] py-3 text-center text-[10px] text-[#919d93]">
                        Showing the 30 most recent entries
                    </div>
                )}
            </section>
            <CheckInFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                checkIn={editing}
                patients={patients}
                patientId={patientId}
            />
            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete this check-in?"
                description={`The wellbeing entry${deleting ? ` from ${formatDate(deleting.checked_in_on)}` : ''} will be permanently removed.`}
                onConfirm={remove}
            />
        </>
    );
}
