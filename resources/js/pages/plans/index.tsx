import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarClock,
    Check,
    ChevronRight,
    ClipboardList,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { PlanFormDialog } from '@/components/forms/plan-form';
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
import { formatDate, titleCase } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PatientOption, TreatmentPlan } from '@/types';

const focusStyles = {
    integrated: 'bg-[#eee9f1] text-[#76667f]',
    adhd: 'bg-[#e8edf2] text-[#5d7486]',
    depression: 'bg-[#f3e8e2] text-[#956e5b]',
};

export default function PlansIndex({
    plans: initialPlans,
    patients,
}: {
    plans: TreatmentPlan[];
    patients: PatientOption[];
}) {
    const params =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();
    const [plans, setPlans] = useState(initialPlans);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('active');
    const [formOpen, setFormOpen] = useState(params.get('create') === '1');
    const [editing, setEditing] = useState<TreatmentPlan | null>(null);
    const [viewing, setViewing] = useState<TreatmentPlan | null>(null);
    const [deleting, setDeleting] = useState<TreatmentPlan | null>(null);
    const patientId = params.get('patient')
        ? Number(params.get('patient'))
        : undefined;
    useEffect(() => setPlans(initialPlans), [initialPlans]);

    const filtered = useMemo(
        () =>
            plans.filter(
                (plan) =>
                    (status === 'all' || plan.status === status) &&
                    (!query ||
                        `${plan.title} ${plan.patient?.name}`
                            .toLowerCase()
                            .includes(query.toLowerCase())),
            ),
        [plans, query, status],
    );
    const openNew = () => {
        setEditing(null);
        setFormOpen(true);
    };
    const edit = (plan: TreatmentPlan) => {
        setViewing(null);
        setEditing(plan);
        setFormOpen(true);
    };
    const toggleGoal = (plan: TreatmentPlan, goalIndex: number) => {
        const previous = plans;
        const goals = plan.goals.map((goal, index) =>
            index === goalIndex
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
            items.map((item) =>
                item.id === plan.id ? { ...item, goals, progress } : item,
            ),
        );
        if (viewing?.id === plan.id) setViewing({ ...plan, goals, progress });
        router.patch(
            `/plans/${plan.id}/goals`,
            { goals },
            { preserveScroll: true, onError: () => setPlans(previous) },
        );
    };
    const remove = () => {
        if (!deleting) return;
        const previous = plans;
        setPlans((items) => items.filter((item) => item.id !== deleting.id));
        router.delete(`/plans/${deleting.id}`, {
            preserveScroll: true,
            onError: () => setPlans(previous),
            onSuccess: () => setDeleting(null),
        });
    };

    return (
        <>
            <Head title="Treatment plans" />
            <PageHeader
                eyebrow="Collaborative care"
                title="Treatment plans"
                description="Make room for structure and flexibility with shared goals, practical interventions, and regular reviews."
                actions={
                    <Button
                        onClick={openNew}
                        className="rounded-xl bg-[#214d40] text-xs text-white hover:bg-[#193f34]"
                    >
                        <Plus /> New care plan
                    </Button>
                }
            />
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#e4e8e0] bg-white p-1">
                    {['active', 'draft', 'completed', 'all'].map((item) => (
                        <button
                            key={item}
                            onClick={() => setStatus(item)}
                            className={cn(
                                'shrink-0 rounded-lg px-4 py-2 text-[11px] font-medium capitalize transition',
                                status === item
                                    ? 'bg-[#eaf0e6] text-[#45604c]'
                                    : 'text-[#8b968d] hover:bg-[#f5f7f2]',
                            )}
                        >
                            {item === 'all' ? 'All plans' : item}
                            <span className="ml-2 text-[9px] opacity-60">
                                {item === 'all'
                                    ? plans.length
                                    : plans.filter(
                                          (plan) => plan.status === item,
                                      ).length}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="relative sm:w-64">
                    <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#9ca69d]" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="h-10 rounded-xl border-[#e2e7de] bg-white pl-9 text-xs shadow-none"
                        placeholder="Search plans…"
                    />
                </div>
            </div>
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-[#e3e7df] bg-white">
                    <EmptyState
                        icon={ClipboardList}
                        title={
                            plans.length === 0
                                ? 'Create your first care plan'
                                : 'No plans in this view'
                        }
                        description={
                            plans.length === 0
                                ? 'Start with a few meaningful goals and the support that will make them feel possible.'
                                : 'Try another status or search term, or create a new plan.'
                        }
                        action={
                            <Button
                                onClick={
                                    plans.length === 0
                                        ? openNew
                                        : () => {
                                              setStatus('all');
                                              setQuery('');
                                          }
                                }
                                variant={
                                    plans.length === 0 ? 'default' : 'outline'
                                }
                                className={cn(
                                    'rounded-xl',
                                    plans.length === 0 &&
                                        'bg-[#214d40] text-white',
                                )}
                            >
                                <Plus />{' '}
                                {plans.length === 0
                                    ? 'New care plan'
                                    : 'Clear filters'}
                            </Button>
                        }
                    />
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                    {filtered.map((plan) => (
                        <article
                            key={plan.id}
                            className="group flex min-h-[360px] flex-col rounded-2xl border border-[#e1e6dd] bg-white p-5 shadow-[0_1px_2px_rgba(32,61,52,.025)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(32,61,52,.055)] sm:p-6"
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            'rounded-full px-2.5 py-1 text-[10px] font-medium',
                                            focusStyles[plan.focus],
                                        )}
                                    >
                                        {plan.focus === 'integrated'
                                            ? 'ADHD + mood'
                                            : titleCase(plan.focus)}
                                    </span>
                                    <StatusBadge status={plan.status} />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className="rounded-lg p-1.5 text-[#96a198] hover:bg-[#f0f3ed]"
                                            aria-label={`Actions for ${plan.title}`}
                                        >
                                            <MoreHorizontal className="size-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-40 rounded-xl bg-white"
                                    >
                                        <DropdownMenuItem
                                            onClick={() => setViewing(plan)}
                                            className="cursor-pointer"
                                        >
                                            <ChevronRight /> View plan
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => edit(plan)}
                                            className="cursor-pointer"
                                        >
                                            <Pencil /> Edit plan
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setDeleting(plan)}
                                            className="cursor-pointer text-[#a35e54] focus:text-[#a35e54]"
                                        >
                                            <Trash2 /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <button
                                onClick={() => setViewing(plan)}
                                className="text-left"
                            >
                                <h2 className="text-[17px] leading-6 font-semibold tracking-[-0.025em] text-[#314d40] transition group-hover:text-[#58755e]">
                                    {plan.title}
                                </h2>
                            </button>
                            <Link
                                href={`/patients/${plan.patient_id}`}
                                className="mt-3 flex items-center gap-2.5"
                            >
                                <PatientAvatar
                                    initials={plan.patient?.initials ?? '??'}
                                    id={plan.patient_id}
                                    className="size-7 text-[9px]"
                                />
                                <span className="text-[11px] font-medium text-[#728177]">
                                    {plan.patient?.name}
                                </span>
                                <ChevronRight className="size-3 text-[#a0aaa1]" />
                            </Link>
                            <div className="mt-6">
                                <div className="mb-2 flex items-center justify-between text-[10px]">
                                    <span className="font-medium text-[#819087]">
                                        Overall progress
                                    </span>
                                    <span className="font-semibold text-[#58735e]">
                                        {plan.progress}%
                                    </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-[#edf0e9]">
                                    <div
                                        className="h-full rounded-full bg-[#87a080] transition-all duration-500"
                                        style={{ width: `${plan.progress}%` }}
                                    />
                                </div>
                            </div>
                            <div className="mt-5 flex-1 space-y-2.5">
                                {plan.goals.slice(0, 3).map((goal, index) => (
                                    <button
                                        key={`${goal.title}-${index}`}
                                        onClick={() => toggleGoal(plan, index)}
                                        className="flex w-full items-start gap-2.5 text-left"
                                    >
                                        <span
                                            className={cn(
                                                'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition',
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
                                                'text-[11px] leading-[1.45]',
                                                goal.completed
                                                    ? 'text-[#a0a9a1] line-through'
                                                    : 'text-[#6c7c70]',
                                            )}
                                        >
                                            {goal.title}
                                        </span>
                                    </button>
                                ))}
                                {plan.goals.length === 0 && (
                                    <p className="text-[11px] text-[#98a199]">
                                        No goals added yet. Edit the plan to add
                                        some.
                                    </p>
                                )}
                            </div>
                            <div className="mt-5 flex items-center justify-between border-t border-[#edf0ea] pt-4">
                                <span className="flex items-center gap-1.5 text-[10px] text-[#8b978e]">
                                    <CalendarClock className="size-3.5" />{' '}
                                    Review{' '}
                                    {formatDate(plan.review_date, {
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </span>
                                <button
                                    onClick={() => setViewing(plan)}
                                    className="text-[10px] font-medium text-[#68816c] hover:text-[#365445]"
                                >
                                    View details <span className="ml-1">→</span>
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <Dialog
                open={!!viewing}
                onOpenChange={(open) => !open && setViewing(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-[#e3e7df] bg-[#fbfcfa] sm:max-w-xl">
                    <DialogHeader>
                        <div className="mb-2 flex items-center gap-2">
                            <span
                                className={cn(
                                    'rounded-full px-2.5 py-1 text-[10px]',
                                    viewing && focusStyles[viewing.focus],
                                )}
                            >
                                {viewing?.focus === 'integrated'
                                    ? 'ADHD + mood'
                                    : titleCase(viewing?.focus ?? '')}
                            </span>
                            {viewing && <StatusBadge status={viewing.status} />}
                        </div>
                        <DialogTitle className="pr-6 text-xl leading-7 tracking-[-0.025em] text-[#2d4a3d]">
                            {viewing?.title}
                        </DialogTitle>
                        <DialogDescription>
                            {viewing?.patient?.name} · Started{' '}
                            {formatDate(viewing?.start_date)}
                        </DialogDescription>
                    </DialogHeader>
                    {viewing && (
                        <div className="space-y-6 pt-2">
                            <div className="rounded-2xl bg-white p-4 ring-1 ring-[#e6eae3]">
                                <div className="mb-2 flex justify-between text-xs">
                                    <span className="text-[#7b897f]">
                                        Progress
                                    </span>
                                    <span className="font-semibold text-[#58735e]">
                                        {viewing.progress}%
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-[#edf0e9]">
                                    <div
                                        className="h-full rounded-full bg-[#87a080]"
                                        style={{
                                            width: `${viewing.progress}%`,
                                        }}
                                    />
                                </div>
                                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#919c93]">
                                    <CalendarClock className="size-3.5" /> Next
                                    review {formatDate(viewing.review_date)}
                                </div>
                            </div>
                            <div>
                                <h3 className="mb-3 text-xs font-semibold tracking-wide text-[#4b6354] uppercase">
                                    Shared goals
                                </h3>
                                <div className="space-y-3">
                                    {viewing.goals.map((goal, index) => (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                toggleGoal(viewing, index)
                                            }
                                            className="flex w-full items-start gap-3 text-left"
                                        >
                                            <span
                                                className={cn(
                                                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                                                    goal.completed
                                                        ? 'border-[#7f9a7e] bg-[#7f9a7e] text-white'
                                                        : 'border-[#cfd7cb] text-transparent',
                                                )}
                                            >
                                                <Check className="size-3" />
                                            </span>
                                            <span
                                                className={cn(
                                                    'text-xs leading-5',
                                                    goal.completed
                                                        ? 'text-[#9da79e] line-through'
                                                        : 'text-[#607267]',
                                                )}
                                            >
                                                {goal.title}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="mb-3 text-xs font-semibold tracking-wide text-[#4b6354] uppercase">
                                    Interventions
                                </h3>
                                <div className="space-y-2">
                                    {viewing.interventions.map(
                                        (item, index) => (
                                            <div
                                                key={index}
                                                className="flex gap-2.5 text-xs leading-5 text-[#6b7c70]"
                                            >
                                                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#94a78c]" />
                                                {item}
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                            {viewing.notes && (
                                <div className="rounded-xl bg-[#f0f3ec] p-4 text-xs leading-5 text-[#718076]">
                                    {viewing.notes}
                                </div>
                            )}
                            <Button
                                onClick={() => edit(viewing)}
                                className="w-full rounded-xl bg-[#214d40] text-white"
                            >
                                <Pencil /> Edit this plan
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <PlanFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                plan={editing}
                patients={patients}
                patientId={patientId}
            />
            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete this treatment plan?"
                description="The plan and its goals will be permanently removed. Existing session records will remain, but will no longer be linked to this plan."
                onConfirm={remove}
            />
        </>
    );
}
