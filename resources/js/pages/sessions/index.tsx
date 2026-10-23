import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    Check,
    Clock3,
    FileText,
    MapPin,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
    Video,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { SessionFormDialog } from '@/components/forms/session-form';
import { PageHeader } from '@/components/page-header';
import { PatientAvatar } from '@/components/patient-avatar';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { formatDate, formatTime, titleCase } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PatientOption, PlanOption, TherapySession } from '@/types';

export default function SessionsIndex({
    sessions: initialSessions,
    patients,
    plans,
}: {
    sessions: TherapySession[];
    patients: PatientOption[];
    plans: PlanOption[];
}) {
    const { url } = usePage();
    const params =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();
    const [sessions, setSessions] = useState(initialSessions);
    const [filter, setFilter] = useState('upcoming');
    const [query, setQuery] = useState(
        params.get('patient')
            ? (patients.find(
                  (patient) => patient.id === Number(params.get('patient')),
              )?.name ?? '')
            : '',
    );
    const [formOpen, setFormOpen] = useState(params.get('create') === '1');
    const [editing, setEditing] = useState<TherapySession | null>(null);
    const [viewing, setViewing] = useState<TherapySession | null>(null);
    const [deleting, setDeleting] = useState<TherapySession | null>(null);
    const patientId = params.get('patient')
        ? Number(params.get('patient'))
        : undefined;
    useEffect(() => setSessions(initialSessions), [initialSessions]);
    useEffect(() => {
        const nextParams = new URLSearchParams(url.split('?')[1] ?? '');
        if (nextParams.get('create') === '1') {
            setEditing(null);
            setFormOpen(true);
        }
        if (nextParams.has('patient')) {
            setQuery(
                patients.find(
                    (patient) =>
                        patient.id === Number(nextParams.get('patient')),
                )?.name ?? '',
            );
        }
    }, [url, patients]);

    const filtered = useMemo(
        () =>
            sessions
                .filter((session) => {
                    const matchesFilter =
                        filter === 'all' ||
                        (filter === 'upcoming'
                            ? session.status === 'scheduled'
                            : session.status === filter);
                    return (
                        matchesFilter &&
                        (!query ||
                            `${session.patient?.name} ${session.type} ${session.notes}`
                                .toLowerCase()
                                .includes(query.toLowerCase()))
                    );
                })
                .sort((a, b) =>
                    filter === 'upcoming'
                        ? new Date(a.scheduled_at).getTime() -
                          new Date(b.scheduled_at).getTime()
                        : new Date(b.scheduled_at).getTime() -
                          new Date(a.scheduled_at).getTime(),
                ),
        [sessions, filter, query],
    );

    const openNew = () => {
        setEditing(null);
        setFormOpen(true);
    };
    const edit = (session: TherapySession) => {
        setViewing(null);
        setEditing(session);
        setFormOpen(true);
    };
    const complete = (session: TherapySession) => {
        const previous = sessions;
        setSessions((items) =>
            items.map((item) =>
                item.id === session.id
                    ? { ...item, status: 'completed' }
                    : item,
            ),
        );
        router.patch(
            `/sessions/${session.id}/complete`,
            {},
            { preserveScroll: true, onError: () => setSessions(previous) },
        );
    };
    const remove = () => {
        if (!deleting) return;
        const previous = sessions;
        setSessions((items) => items.filter((item) => item.id !== deleting.id));
        router.delete(`/sessions/${deleting.id}`, {
            preserveScroll: true,
            onError: () => setSessions(previous),
            onSuccess: () => setDeleting(null),
        });
    };

    return (
        <>
            <Head title="Sessions" />
            <PageHeader
                eyebrow="Time for care"
                title="Sessions"
                description="Keep appointments, clinical notes, and between-session experiments together—without losing the human thread."
                actions={
                    <Button
                        onClick={openNew}
                        className="rounded-xl bg-[#214d40] text-xs text-white hover:bg-[#193f34]"
                    >
                        <Plus /> Schedule session
                    </Button>
                }
            />
            <div className="mb-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-[#e3e7df] bg-white">
                {[
                    [
                        'Scheduled ahead',
                        sessions.filter((s) => s.status === 'scheduled').length,
                        CalendarDays,
                        'bg-[#e8edf1] text-[#607d8e]',
                    ],
                    [
                        'Completed',
                        sessions.filter((s) => s.status === 'completed').length,
                        Check,
                        'bg-[#e8f0e5] text-[#66836a]',
                    ],
                    [
                        'Clinical notes',
                        sessions.filter((s) => s.notes).length,
                        FileText,
                        'bg-[#f2e9df] text-[#967457]',
                    ],
                ].map(([label, value, Icon, color]) => {
                    const StatIcon = Icon as typeof CalendarDays;
                    return (
                        <div
                            key={label as string}
                            className="flex items-center gap-3 border-r border-[#edf0ea] p-4 last:border-r-0 sm:gap-4 sm:px-6"
                        >
                            <div
                                className={cn(
                                    'hidden size-9 items-center justify-center rounded-xl sm:flex',
                                    color as string,
                                )}
                            >
                                <StatIcon className="size-4" />
                            </div>
                            <div>
                                <div className="text-xl font-semibold tracking-[-0.03em] text-[#345044] sm:text-2xl">
                                    {value as number}
                                </div>
                                <div className="mt-0.5 text-[9px] text-[#8e9a90] sm:text-[11px]">
                                    {label as string}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#e4e8e0] bg-white p-1">
                    {['upcoming', 'completed', 'cancelled', 'all'].map(
                        (item) => (
                            <button
                                key={item}
                                onClick={() => setFilter(item)}
                                className={cn(
                                    'shrink-0 rounded-lg px-4 py-2 text-[11px] font-medium capitalize transition',
                                    filter === item
                                        ? 'bg-[#eaf0e6] text-[#45604c]'
                                        : 'text-[#8b968d] hover:bg-[#f5f7f2]',
                                )}
                            >
                                {item === 'all' ? 'All sessions' : item}
                            </button>
                        ),
                    )}
                </div>
                <div className="relative sm:w-64">
                    <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#9ca69d]" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="h-10 rounded-xl border-[#e2e7de] bg-white pl-9 text-xs shadow-none"
                        placeholder="Search sessions…"
                    />
                </div>
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#e3e7df] bg-white shadow-[0_1px_2px_rgba(32,61,52,.025)]">
                <div className="flex items-center justify-between border-b border-[#edf0ea] px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="text-xs font-semibold text-[#405a4b]">
                            {filter === 'upcoming'
                                ? 'Upcoming appointments'
                                : filter === 'all'
                                  ? 'Session history'
                                  : `${titleCase(filter)} sessions`}
                        </h2>
                        <p className="mt-1 text-[10px] text-[#97a198]">
                            {filtered.length}{' '}
                            {filtered.length === 1 ? 'session' : 'sessions'} in
                            this view
                        </p>
                    </div>
                    <CalendarDays className="size-4 text-[#9aa59b]" />
                </div>
                {filtered.length === 0 ? (
                    <EmptyState
                        icon={CalendarDays}
                        title={
                            sessions.length === 0
                                ? 'No sessions yet'
                                : 'Nothing in this view'
                        }
                        description={
                            sessions.length === 0
                                ? 'Schedule your first appointment and keep every conversation connected.'
                                : 'Try another filter or schedule a new session.'
                        }
                        action={
                            <Button
                                onClick={openNew}
                                className="rounded-xl bg-[#214d40] text-white"
                            >
                                <Plus /> Schedule session
                            </Button>
                        }
                    />
                ) : (
                    <div className="divide-y divide-[#edf0ea]">
                        {filtered.map((session) => {
                            const date = new Date(session.scheduled_at);
                            return (
                                <div
                                    key={session.id}
                                    className="group flex items-center gap-3 px-4 py-4 transition hover:bg-[#fbfcfa] sm:gap-5 sm:px-6"
                                >
                                    <div className="flex w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[#f2f5ee] py-2 text-[#617660]">
                                        <span className="text-[8px] font-semibold uppercase">
                                            {formatDate(session.scheduled_at, {
                                                month: 'short',
                                            })}
                                        </span>
                                        <span className="text-lg leading-5 font-semibold">
                                            {date.getDate()}
                                        </span>
                                    </div>
                                    <div className="hidden w-[72px] shrink-0 sm:block">
                                        <div className="text-[11px] font-medium text-[#64776a]">
                                            {formatTime(session.scheduled_at)}
                                        </div>
                                        <div className="mt-1 flex items-center gap-1 text-[9px] text-[#9aa49b]">
                                            <Clock3 className="size-2.5" />
                                            {session.duration} min
                                        </div>
                                    </div>
                                    <PatientAvatar
                                        initials={
                                            session.patient?.initials ?? '??'
                                        }
                                        id={session.patient_id}
                                        className="hidden size-9 sm:flex"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            href={`/patients/${session.patient_id}`}
                                            className="truncate text-xs font-semibold text-[#3b5547] hover:text-[#6a846d] sm:text-[13px]"
                                        >
                                            {session.patient?.name}
                                        </Link>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] text-[#929e94] sm:text-[10px]">
                                            <span>
                                                {titleCase(session.type)}
                                            </span>
                                            <span className="size-0.5 rounded-full bg-[#b8c0b9]" />
                                            <span className="flex items-center gap-1">
                                                {session.location ===
                                                'video' ? (
                                                    <Video className="size-3" />
                                                ) : (
                                                    <MapPin className="size-3" />
                                                )}
                                                {session.location ===
                                                'in_person'
                                                    ? 'In person'
                                                    : titleCase(
                                                          session.location,
                                                      )}
                                            </span>
                                            <span className="sm:hidden">
                                                ·{' '}
                                                {formatTime(
                                                    session.scheduled_at,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="hidden md:block">
                                        <StatusBadge status={session.status} />
                                    </div>
                                    {(session.notes || session.homework) && (
                                        <button
                                            onClick={() => setViewing(session)}
                                            className="hidden items-center gap-1 text-[10px] font-medium text-[#748b78] hover:text-[#365445] lg:flex"
                                        >
                                            Notes{' '}
                                            <ArrowRight className="size-3" />
                                        </button>
                                    )}
                                    {session.status === 'scheduled' && (
                                        <button
                                            onClick={() => complete(session)}
                                            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#dfe6db] text-[#7f9381] hover:bg-[#edf3e9]"
                                            title="Mark complete"
                                        >
                                            <Check className="size-3.5" />
                                        </button>
                                    )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                className="rounded-lg p-1.5 text-[#98a299] hover:bg-[#edf1ea]"
                                                aria-label="Session actions"
                                            >
                                                <MoreHorizontal className="size-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-44 rounded-xl bg-white"
                                        >
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setViewing(session)
                                                }
                                                className="cursor-pointer"
                                            >
                                                <FileText /> View details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => edit(session)}
                                                className="cursor-pointer"
                                            >
                                                <Pencil /> Edit session
                                            </DropdownMenuItem>
                                            {session.status === 'scheduled' && (
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        complete(session)
                                                    }
                                                    className="cursor-pointer"
                                                >
                                                    <Check /> Mark complete
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setDeleting(session)
                                                }
                                                className="cursor-pointer text-[#a35e54] focus:text-[#a35e54]"
                                            >
                                                <Trash2 /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <Dialog
                open={!!viewing}
                onOpenChange={(open) => !open && setViewing(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-[#e3e7df] bg-[#fbfcfa] sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl tracking-[-0.025em] text-[#2d4a3d]">
                            {viewing?.patient?.name}
                        </DialogTitle>
                        <DialogDescription>
                            {viewing &&
                                `${titleCase(viewing.type)} · ${formatDate(viewing.scheduled_at, { weekday: 'long', month: 'long', day: 'numeric' })} at ${formatTime(viewing.scheduled_at)}`}
                        </DialogDescription>
                    </DialogHeader>
                    {viewing && (
                        <div className="space-y-5 pt-2">
                            <div className="flex items-center gap-3">
                                <StatusBadge status={viewing.status} />
                                <span className="text-xs text-[#849087]">
                                    {viewing.duration} minutes ·{' '}
                                    {viewing.location === 'in_person'
                                        ? 'In person'
                                        : titleCase(viewing.location)}
                                </span>
                            </div>
                            {(viewing.mood_before || viewing.mood_after) && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-white p-4 ring-1 ring-[#e5e9e1]">
                                        <div className="text-[10px] text-[#8d998f]">
                                            Mood before
                                        </div>
                                        <div className="mt-1 text-2xl font-semibold text-[#5f7663]">
                                            {viewing.mood_before ?? '—'}
                                            <span className="text-xs font-normal text-[#9aa49b]">
                                                /10
                                            </span>
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-white p-4 ring-1 ring-[#e5e9e1]">
                                        <div className="text-[10px] text-[#8d998f]">
                                            Mood after
                                        </div>
                                        <div className="mt-1 text-2xl font-semibold text-[#5f7663]">
                                            {viewing.mood_after ?? '—'}
                                            <span className="text-xs font-normal text-[#9aa49b]">
                                                /10
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div>
                                <h3 className="mb-2 text-xs font-semibold text-[#4c6354]">
                                    Session notes
                                </h3>
                                <p className="rounded-xl bg-white p-4 text-xs leading-6 whitespace-pre-wrap text-[#6d7d71] ring-1 ring-[#e5e9e1]">
                                    {viewing.notes ||
                                        'No notes recorded for this session yet.'}
                                </p>
                            </div>
                            <div>
                                <h3 className="mb-2 text-xs font-semibold text-[#4c6354]">
                                    Between-session experiment
                                </h3>
                                <p className="rounded-xl bg-[#eef3e9] p-4 text-xs leading-6 whitespace-pre-wrap text-[#627663]">
                                    {viewing.homework ||
                                        'No between-session experiment recorded.'}
                                </p>
                            </div>
                            <Button
                                onClick={() => edit(viewing)}
                                className="w-full rounded-xl bg-[#214d40] text-white"
                            >
                                <Pencil /> Edit session & notes
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <SessionFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                session={editing}
                patients={patients}
                plans={plans}
                patientId={patientId}
            />
            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete this session?"
                description="The appointment, notes, and mood ratings for this session will be permanently removed."
                onConfirm={remove}
            />
        </>
    );
}
