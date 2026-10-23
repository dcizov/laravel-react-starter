import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    CalendarDays,
    Check,
    ChevronRight,
    ClipboardList,
    Clock3,
    MapPin,
    Plus,
    TrendingUp,
    UserRound,
    UsersRound,
    Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PatientAvatar } from '@/components/patient-avatar';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { WellbeingChart } from '@/components/wellbeing-chart';
import { formatDate, formatTime, titleCase } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TherapySession, TreatmentPlan, TrendPoint } from '@/types';

type Stats = {
    activePatients: number;
    sessionsToday: number;
    completedToday: number;
    activePlans: number;
    reviewsDue: number;
    averageMood: number | null;
    moodChange: number | null;
};
type Props = {
    stats: Stats;
    todaySessions: TherapySession[];
    planProgress: TreatmentPlan[];
    reviews: TreatmentPlan[];
    trend: TrendPoint[];
};

export default function Dashboard({
    stats,
    todaySessions,
    planProgress,
    reviews,
    trend,
}: Props) {
    const { auth } = usePage().props;
    const [sessions, setSessions] = useState(todaySessions);
    const [metric, setMetric] = useState<'mood' | 'energy'>('mood');
    const [updating, setUpdating] = useState<number | null>(null);
    useEffect(() => setSessions(todaySessions), [todaySessions]);
    const firstName = (auth.user?.name || 'Maya')
        .replace(/^Dr\.\s*/, '')
        .split(' ')[0];
    const hour = new Date().getHours();
    const greeting =
        hour < 12
            ? 'Good morning'
            : hour < 18
              ? 'Good afternoon'
              : 'Good evening';

    const completeSession = (session: TherapySession) => {
        const previous = sessions;
        setUpdating(session.id);
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
            {
                preserveScroll: true,
                onError: () => setSessions(previous),
                onFinish: () => setUpdating(null),
            },
        );
    };

    const statCards = [
        {
            label: 'Active patients',
            value: stats.activePatients,
            note: 'People in your care',
            icon: UsersRound,
            color: 'bg-[#e8f0e5] text-[#5d7c62]',
        },
        {
            label: "Today's sessions",
            value: stats.sessionsToday,
            note: `${stats.completedToday} completed · ${Math.max(0, stats.sessionsToday - stats.completedToday)} ahead`,
            icon: CalendarDays,
            color: 'bg-[#e8edf1] text-[#607d8e]',
        },
        {
            label: 'Active care plans',
            value: stats.activePlans,
            note: `${stats.reviewsDue} reviews coming up`,
            icon: ClipboardList,
            color: 'bg-[#f2e9df] text-[#9a7657]',
        },
        {
            label: 'Average check-in',
            value: stats.averageMood ? `${stats.averageMood}` : '—',
            suffix: stats.averageMood ? '/10' : '',
            note:
                stats.moodChange !== null
                    ? `${stats.moodChange >= 0 ? '+' : ''}${stats.moodChange} from previous week`
                    : 'Last 7 days',
            icon: Activity,
            color: 'bg-[#f1e6e3] text-[#a57162]',
        },
    ];

    return (
        <>
            <Head title="Overview" />
            <PageHeader
                eyebrow="Your practice · Today"
                title={`${greeting}, ${firstName}.`}
                description="A clear view of today, with space to focus on the people behind the plans."
                actions={
                    <>
                        <Button
                            asChild
                            variant="outline"
                            className="hidden rounded-xl border-[#dce3d8] bg-white text-xs text-[#486053] sm:inline-flex"
                        >
                            <Link href="/plans">View care plans</Link>
                        </Button>
                        <Button
                            asChild
                            className="rounded-xl bg-[#214d40] text-xs text-white hover:bg-[#193f34]"
                        >
                            <Link href="/patients?create=1">
                                <Plus /> Add patient
                            </Link>
                        </Button>
                    </>
                }
            />

            <section
                className="mb-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#e3e7df] bg-white shadow-[0_1px_2px_rgba(32,61,52,.025)] xl:grid-cols-4"
                aria-label="Practice summary"
            >
                {statCards.map((stat, index) => (
                    <div
                        key={stat.label}
                        className={cn(
                            'relative p-4 sm:p-5',
                            index % 2 === 1 && 'border-l border-[#edf0ea]',
                            index >= 2 &&
                                'border-t border-[#edf0ea] xl:border-t-0',
                            index > 0 && 'xl:border-l xl:border-[#edf0ea]',
                        )}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="text-[11px] font-medium text-[#7f8b82] sm:text-xs">
                                {stat.label}
                            </div>
                            <div
                                className={cn(
                                    'flex size-8 items-center justify-center rounded-[10px]',
                                    stat.color,
                                )}
                            >
                                <stat.icon
                                    className="size-4"
                                    strokeWidth={1.8}
                                />
                            </div>
                        </div>
                        <div className="mt-1 text-[28px] leading-none font-semibold tracking-[-0.04em] text-[#28463a] sm:mt-2 sm:text-[32px]">
                            {stat.value}
                            <span className="ml-0.5 text-sm font-normal text-[#9ba59d]">
                                {stat.suffix}
                            </span>
                        </div>
                        <div className="mt-2.5 truncate text-[10px] text-[#98a199] sm:text-[11px]">
                            {stat.note}
                        </div>
                    </div>
                ))}
            </section>

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,.85fr)]">
                <div className="space-y-6">
                    <section className="overflow-hidden rounded-2xl border border-[#e3e7df] bg-white shadow-[0_1px_2px_rgba(32,61,52,.025)]">
                        <div className="flex items-center justify-between border-b border-[#edf0ea] px-5 py-4 sm:px-6">
                            <div>
                                <h2 className="text-sm font-semibold tracking-[-0.015em] text-[#2d493e]">
                                    Today’s schedule
                                </h2>
                                <p className="mt-1 text-[11px] text-[#919c93]">
                                    {formatDate(new Date().toISOString(), {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <Link
                                href="/sessions"
                                className="flex items-center gap-1 text-[11px] font-medium text-[#65806c] hover:text-[#214d40]"
                            >
                                Full schedule{' '}
                                <ChevronRight className="size-3.5" />
                            </Link>
                        </div>
                        {sessions.length === 0 ? (
                            <EmptyState
                                icon={CalendarDays}
                                title="A clear day"
                                description="No sessions are scheduled today. Enjoy the breathing room or plan ahead."
                                action={
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="rounded-xl"
                                    >
                                        <Link href="/sessions?create=1">
                                            Schedule a session
                                        </Link>
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="divide-y divide-[#eff1ec]">
                                {sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className={cn(
                                            'group flex items-center gap-3 px-4 py-4 transition sm:gap-4 sm:px-6',
                                            session.status === 'completed' &&
                                                'bg-[#fcfdfb]',
                                        )}
                                    >
                                        <div className="w-[57px] shrink-0 sm:w-[66px]">
                                            <div
                                                className={cn(
                                                    'text-xs font-semibold',
                                                    session.status ===
                                                        'completed'
                                                        ? 'text-[#9ca59d]'
                                                        : 'text-[#3d574a]',
                                                )}
                                            >
                                                {formatTime(
                                                    session.scheduled_at,
                                                )}
                                            </div>
                                            <div className="mt-1 text-[9px] text-[#a0a8a1]">
                                                {session.duration} min
                                            </div>
                                        </div>
                                        <div
                                            className={cn(
                                                'h-9 w-px shrink-0',
                                                session.status === 'completed'
                                                    ? 'bg-[#dce5d8]'
                                                    : 'bg-[#e6b39d]',
                                            )}
                                        />
                                        <PatientAvatar
                                            initials={
                                                session.patient?.initials ??
                                                '??'
                                            }
                                            id={session.patient_id}
                                            className={cn(
                                                'hidden size-9 sm:flex',
                                                session.status ===
                                                    'completed' && 'opacity-65',
                                            )}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <Link
                                                href={`/patients/${session.patient_id}`}
                                                className={cn(
                                                    'block truncate text-xs font-semibold hover:text-[#66836e] sm:text-[13px]',
                                                    session.status ===
                                                        'completed'
                                                        ? 'text-[#7f8d83]'
                                                        : 'text-[#334e42]',
                                                )}
                                            >
                                                {session.patient?.name}
                                            </Link>
                                            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[#939e95]">
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
                                            </div>
                                        </div>
                                        <div className="hidden sm:block">
                                            <StatusBadge
                                                status={session.status}
                                            />
                                        </div>
                                        {session.status === 'scheduled' ? (
                                            <button
                                                disabled={
                                                    updating === session.id
                                                }
                                                onClick={() =>
                                                    completeSession(session)
                                                }
                                                className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#dfe6db] text-[#7f9381] transition hover:border-[#87a08a] hover:bg-[#edf3e9] hover:text-[#42634c] disabled:opacity-40"
                                                title="Mark session complete"
                                                aria-label={`Mark ${session.patient?.name} session complete`}
                                            >
                                                <Check className="size-4" />
                                            </button>
                                        ) : (
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e8f0e4] text-[#6a866d]">
                                                <Check className="size-4" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {sessions.length > 0 && (
                            <Link
                                href="/sessions?create=1"
                                className="flex items-center justify-center gap-2 border-t border-[#edf0ea] py-3 text-[11px] font-medium text-[#7b8d80] transition hover:bg-[#fafbf9] hover:text-[#385b49]"
                            >
                                <Plus className="size-3.5" /> Add to today’s
                                schedule
                            </Link>
                        )}
                    </section>

                    <section className="rounded-2xl border border-[#e3e7df] bg-white p-5 shadow-[0_1px_2px_rgba(32,61,52,.025)] sm:p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-[#2d493e]">
                                    Treatment momentum
                                </h2>
                                <p className="mt-1 text-[11px] text-[#919c93]">
                                    Progress across active care plans
                                </p>
                            </div>
                            <Link
                                href="/plans"
                                className="text-[11px] font-medium text-[#65806c] hover:text-[#214d40]"
                            >
                                View all
                            </Link>
                        </div>
                        {planProgress.length === 0 ? (
                            <EmptyState
                                icon={ClipboardList}
                                title="No active plans yet"
                                description="Create a plan to begin tracking collaborative goals."
                            />
                        ) : (
                            <div className="grid gap-x-7 gap-y-5 sm:grid-cols-2">
                                {planProgress.map((plan) => (
                                    <Link
                                        href={`/patients/${plan.patient_id}`}
                                        key={plan.id}
                                        className="group rounded-xl p-1 transition hover:bg-[#fafbf9]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <PatientAvatar
                                                initials={
                                                    plan.patient?.initials ??
                                                    '??'
                                                }
                                                id={plan.patient_id}
                                                className="size-8 text-[10px]"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-xs font-medium text-[#40594c] group-hover:text-[#214d40]">
                                                    {plan.patient?.name}
                                                </div>
                                                <div className="mt-0.5 truncate text-[10px] text-[#98a199]">
                                                    {plan.title}
                                                </div>
                                            </div>
                                            <span className="text-xs font-semibold text-[#627b68]">
                                                {plan.progress}%
                                            </span>
                                        </div>
                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf0e9]">
                                            <div
                                                className="h-full rounded-full bg-[#88a181] transition-all duration-500"
                                                style={{
                                                    width: `${plan.progress}%`,
                                                }}
                                            />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="rounded-2xl border border-[#e3e7df] bg-white p-5 shadow-[0_1px_2px_rgba(32,61,52,.025)] sm:p-6">
                        <div className="mb-2 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-[#2d493e]">
                                    Wellbeing pulse
                                </h2>
                                <p className="mt-1 text-[11px] text-[#919c93]">
                                    Average across patient check-ins
                                </p>
                            </div>
                            <div className="flex rounded-lg bg-[#f1f3ee] p-0.5">
                                {(['mood', 'energy'] as const).map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => setMetric(item)}
                                        className={cn(
                                            'rounded-md px-2.5 py-1 text-[9px] font-medium capitalize transition',
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
                        <WellbeingChart data={trend} metric={metric} />
                        <div className="mt-1 flex items-center justify-between border-t border-[#eff1ec] pt-3">
                            <span className="flex items-center gap-1.5 text-[10px] text-[#8c988e]">
                                <TrendingUp className="size-3.5 text-[#77937a]" />{' '}
                                A gentle upward view, not a diagnosis
                            </span>
                            <Link
                                href="/check-ins"
                                className="text-[10px] font-medium text-[#65806c]"
                            >
                                Details
                            </Link>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-[#e3e7df] bg-white shadow-[0_1px_2px_rgba(32,61,52,.025)]">
                        <div className="flex items-center justify-between border-b border-[#edf0ea] px-5 py-4">
                            <div>
                                <h2 className="text-sm font-semibold text-[#2d493e]">
                                    Coming up for review
                                </h2>
                                <p className="mt-1 text-[11px] text-[#919c93]">
                                    A little preparation, ahead of time
                                </p>
                            </div>
                            <div className="flex size-8 items-center justify-center rounded-[10px] bg-[#f2eee4] text-[#9a835d]">
                                <Clock3 className="size-4" />
                            </div>
                        </div>
                        {reviews.length === 0 ? (
                            <EmptyState
                                icon={ClipboardList}
                                title="No reviews due"
                                description="Your upcoming plan reviews will appear here."
                            />
                        ) : (
                            <div className="divide-y divide-[#eff1ec]">
                                {reviews.map((plan) => (
                                    <Link
                                        href="/plans"
                                        key={plan.id}
                                        className="group flex items-center gap-3 px-5 py-4 transition hover:bg-[#fafbf9]"
                                    >
                                        <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl bg-[#f1f4ed] text-[#617660]">
                                            <span className="text-[8px] font-semibold uppercase">
                                                {formatDate(plan.review_date, {
                                                    month: 'short',
                                                })}
                                            </span>
                                            <span className="text-sm leading-4 font-semibold">
                                                {
                                                    formatDate(
                                                        plan.review_date,
                                                        { day: 'numeric' },
                                                    ).split(' ')[0]
                                                }
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-xs font-medium text-[#40594c]">
                                                {plan.patient?.name}
                                            </div>
                                            <div className="mt-1 truncate text-[10px] text-[#98a199]">
                                                {plan.title}
                                            </div>
                                        </div>
                                        <ArrowRight className="size-3.5 text-[#a7afa8] transition group-hover:translate-x-0.5 group-hover:text-[#65806c]" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="relative overflow-hidden rounded-2xl bg-[#e8eee2] p-5 text-[#365343]">
                        <div className="absolute -right-7 -bottom-10 size-32 rounded-full border border-[#6e8a6b]/10" />
                        <div className="absolute -right-3 -bottom-6 size-20 rounded-full border border-[#6e8a6b]/10" />
                        <UserRound className="mb-3 size-4 text-[#779071]" />
                        <p className="max-w-[240px] text-xs leading-5 font-medium">
                            “The goal is a plan that supports the person—not a
                            person who serves the plan.”
                        </p>
                        <p className="mt-2 text-[10px] text-[#7c907b]">
                            A small reminder for flexible care
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
