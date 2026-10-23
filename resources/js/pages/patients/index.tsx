import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    ChevronRight,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
    UserRound,
    UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { PatientFormDialog } from '@/components/forms/patient-form';
import { PageHeader } from '@/components/page-header';
import { PatientAvatar } from '@/components/patient-avatar';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { relativeDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Patient } from '@/types';

export default function PatientsIndex({
    patients: initialPatients,
}: {
    patients: Patient[];
}) {
    const { url } = usePage();
    const params =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();
    const [patients, setPatients] = useState(initialPatients);
    const [search, setSearch] = useState(params.get('search') ?? '');
    const [status, setStatus] = useState('all');
    const [focus, setFocus] = useState('all');
    const [formOpen, setFormOpen] = useState(params.get('create') === '1');
    const [editing, setEditing] = useState<Patient | null>(null);
    const [deleting, setDeleting] = useState<Patient | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);
    useEffect(() => setPatients(initialPatients), [initialPatients]);
    useEffect(() => {
        const nextParams = new URLSearchParams(url.split('?')[1] ?? '');
        if (nextParams.get('create') === '1') {
            setEditing(null);
            setFormOpen(true);
        }
        if (nextParams.has('search')) {
            setSearch(nextParams.get('search') ?? '');
        }
    }, [url]);

    const filtered = useMemo(
        () =>
            patients.filter((patient) => {
                const query = search.toLowerCase().trim();
                const matchesSearch =
                    !query ||
                    `${patient.name} ${patient.email} ${patient.diagnoses}`
                        .toLowerCase()
                        .includes(query);
                const matchesStatus =
                    status === 'all' || patient.status === status;
                const diagnoses = patient.diagnoses.toLowerCase();
                const matchesFocus =
                    focus === 'all' ||
                    (focus === 'adhd'
                        ? diagnoses.includes('adhd')
                        : diagnoses.includes('depress') ||
                          diagnoses.includes('mood'));
                return matchesSearch && matchesStatus && matchesFocus;
            }),
        [patients, search, status, focus],
    );

    const edit = (patient: Patient) => {
        setEditing(patient);
        setFormOpen(true);
    };
    const openNew = () => {
        setEditing(null);
        setFormOpen(true);
    };
    const remove = () => {
        if (!deleting) return;
        const previous = patients;
        setDeleteProcessing(true);
        setPatients((items) => items.filter((item) => item.id !== deleting.id));
        router.delete(`/patients/${deleting.id}`, {
            preserveScroll: true,
            onError: () => setPatients(previous),
            onSuccess: () => setDeleting(null),
            onFinish: () => setDeleteProcessing(false),
        });
    };
    const resetFilters = () => {
        setSearch('');
        setStatus('all');
        setFocus('all');
    };
    const counts = {
        all: patients.length,
        active: patients.filter((p) => p.status === 'active').length,
        waitlist: patients.filter((p) => p.status === 'waitlist').length,
        discharged: patients.filter((p) => p.status === 'discharged').length,
    };

    return (
        <>
            <Head title="Patients" />
            <PageHeader
                eyebrow="People in your care"
                title="Patients"
                description="One connected view of each person’s context, care plan, sessions, and everyday wellbeing."
                actions={
                    <Button
                        onClick={openNew}
                        className="rounded-xl bg-[#214d40] text-xs text-white hover:bg-[#193f34]"
                    >
                        <Plus /> Add patient
                    </Button>
                }
            />
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#e3e7df] bg-white p-3 sm:p-4 xl:flex-row xl:items-center">
                <div className="relative min-w-0 flex-1 xl:max-w-sm">
                    <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#9aa49b]" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or area of focus…"
                        className="h-10 rounded-xl border-[#e2e7de] bg-[#fafbf9] pl-10 text-xs shadow-none"
                    />
                </div>
                <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-[#f3f5f0] p-1">
                    {(['all', 'active', 'waitlist', 'discharged'] as const).map(
                        (item) => (
                            <button
                                key={item}
                                onClick={() => setStatus(item)}
                                className={cn(
                                    'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium capitalize transition',
                                    status === item
                                        ? 'bg-white text-[#365545] shadow-sm'
                                        : 'text-[#87938a] hover:text-[#4d6455]',
                                )}
                            >
                                {item === 'all' ? 'All patients' : item}
                                <span
                                    className={cn(
                                        'rounded-md px-1.5 py-0.5 text-[9px]',
                                        status === item
                                            ? 'bg-[#edf2e9]'
                                            : 'bg-black/[0.035]',
                                    )}
                                >
                                    {counts[item]}
                                </span>
                            </button>
                        ),
                    )}
                </div>
                <select
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    className="h-10 rounded-xl border border-[#e2e7de] bg-white px-3 text-xs text-[#5f7165] outline-none xl:ml-auto"
                    aria-label="Filter by area of focus"
                >
                    <option value="all">All areas of focus</option>
                    <option value="adhd">ADHD</option>
                    <option value="depression">Depression</option>
                </select>
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#e3e7df] bg-white shadow-[0_1px_2px_rgba(32,61,52,.025)]">
                <div className="flex items-center justify-between border-b border-[#edf0ea] px-5 py-4">
                    <div className="text-xs font-medium text-[#53695b]">
                        {filtered.length}{' '}
                        {filtered.length === 1 ? 'patient' : ' patients'}
                        <span className="ml-2 font-normal text-[#9aa39b]">
                            · sorted by first name
                        </span>
                    </div>
                    <UsersRound className="size-4 text-[#9ba69c]" />
                </div>
                {filtered.length === 0 ? (
                    <EmptyState
                        icon={UserRound}
                        title={
                            patients.length === 0
                                ? 'Your patient list starts here'
                                : 'No patients match'
                        }
                        description={
                            patients.length === 0
                                ? 'Add your first patient to create a connected care workspace.'
                                : 'Try a different search or clear your filters to see more people.'
                        }
                        action={
                            patients.length === 0 ? (
                                <Button
                                    onClick={openNew}
                                    className="rounded-xl bg-[#214d40] text-white"
                                >
                                    <Plus /> Add patient
                                </Button>
                            ) : (
                                <Button
                                    onClick={resetFilters}
                                    variant="outline"
                                    className="rounded-xl"
                                >
                                    Clear filters
                                </Button>
                            )
                        }
                    />
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[850px] text-left">
                                <thead>
                                    <tr className="border-b border-[#edf0ea] bg-[#fbfcfa] text-[9px] font-semibold tracking-[0.1em] text-[#99a39a] uppercase">
                                        <th className="px-6 py-3.5">Patient</th>
                                        <th className="px-4 py-3.5">
                                            Areas of focus
                                        </th>
                                        <th className="px-4 py-3.5">
                                            Active care plan
                                        </th>
                                        <th className="px-4 py-3.5">
                                            Last check-in
                                        </th>
                                        <th className="px-4 py-3.5">Status</th>
                                        <th className="w-14 px-4 py-3.5">
                                            <span className="sr-only">
                                                Actions
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#eff1ec]">
                                    {filtered.map((patient) => (
                                        <tr
                                            key={patient.id}
                                            className="group transition hover:bg-[#fbfcfa]"
                                        >
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/patients/${patient.id}`}
                                                    className="flex items-center gap-3"
                                                >
                                                    <PatientAvatar
                                                        initials={
                                                            patient.initials
                                                        }
                                                        id={patient.id}
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#354f42]">
                                                            {patient.name}
                                                            <ArrowUpRight className="size-3 text-[#a1aba3] opacity-0 transition group-hover:opacity-100" />
                                                        </div>
                                                        <div className="mt-1 text-[10px] text-[#96a097]">
                                                            {patient.email ||
                                                                `${patient.sessions_count ?? 0} sessions recorded`}
                                                        </div>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="max-w-[220px] px-4 py-4">
                                                <div
                                                    className="truncate text-[11px] leading-5 text-[#6d7d71]"
                                                    title={patient.diagnoses}
                                                >
                                                    {patient.diagnoses}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {patient.active_plan ? (
                                                    <div className="w-32">
                                                        <div className="mb-1.5 flex items-center justify-between text-[10px]">
                                                            <span className="max-w-24 truncate text-[#6d7d71]">
                                                                {
                                                                    patient
                                                                        .active_plan
                                                                        .title
                                                                }
                                                            </span>
                                                            <span className="font-medium text-[#6b826d]">
                                                                {
                                                                    patient
                                                                        .active_plan
                                                                        .progress
                                                                }
                                                                %
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 rounded-full bg-[#edf0e9]">
                                                            <div
                                                                className="h-full rounded-full bg-[#8da287]"
                                                                style={{
                                                                    width: `${patient.active_plan.progress}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Link
                                                        href={`/plans?create=1&patient=${patient.id}`}
                                                        className="text-[10px] font-medium text-[#7b927c] hover:underline"
                                                    >
                                                        + Create plan
                                                    </Link>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-[11px] text-[#7f8d82]">
                                                {relativeDate(
                                                    patient.latest_check_in,
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <StatusBadge
                                                    status={patient.status}
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <button
                                                            className="rounded-lg p-2 text-[#97a199] hover:bg-[#edf1ea] hover:text-[#4a6352]"
                                                            aria-label={`Actions for ${patient.name}`}
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-40 rounded-xl bg-white"
                                                    >
                                                        <DropdownMenuItem
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/patients/${patient.id}`}
                                                                className="cursor-pointer"
                                                            >
                                                                <ChevronRight />{' '}
                                                                View record
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                edit(patient)
                                                            }
                                                            className="cursor-pointer"
                                                        >
                                                            <Pencil /> Edit
                                                            details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                setDeleting(
                                                                    patient,
                                                                )
                                                            }
                                                            className="cursor-pointer text-[#a35e54] focus:text-[#a35e54]"
                                                        >
                                                            <Trash2 /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="divide-y divide-[#edf0ea] md:hidden">
                            {filtered.map((patient) => (
                                <div key={patient.id} className="p-4">
                                    <div className="flex items-start gap-3">
                                        <PatientAvatar
                                            initials={patient.initials}
                                            id={patient.id}
                                        />
                                        <Link
                                            href={`/patients/${patient.id}`}
                                            className="min-w-0 flex-1"
                                        >
                                            <div className="text-sm font-semibold text-[#354f42]">
                                                {patient.name}
                                            </div>
                                            <div className="mt-1 line-clamp-1 text-[10px] text-[#8c988e]">
                                                {patient.diagnoses}
                                            </div>
                                        </Link>
                                        <button
                                            onClick={() => edit(patient)}
                                            className="rounded-lg p-2 text-[#87948a]"
                                        >
                                            <Pencil className="size-4" />
                                        </button>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between pl-[52px]">
                                        <StatusBadge status={patient.status} />
                                        <Link
                                            href={`/patients/${patient.id}`}
                                            className="flex items-center gap-1 text-[10px] font-medium text-[#6a836e]"
                                        >
                                            View record{' '}
                                            <ChevronRight className="size-3" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </section>
            <PatientFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                patient={editing}
            />
            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete ${deleting?.name ?? 'patient'}?`}
                description="This permanently removes the patient record along with connected plans, sessions, and check-ins. This action cannot be undone."
                onConfirm={remove}
                processing={deleteProcessing}
            />
        </>
    );
}
