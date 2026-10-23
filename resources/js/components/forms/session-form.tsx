import { useForm } from '@inertiajs/react';
import { useEffect, type FormEvent } from 'react';
import {
    Field,
    FormDialog,
    inputClass,
    selectClass,
} from '@/components/form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { toDateTimeLocal } from '@/lib/format';
import type { PatientOption, PlanOption, TherapySession } from '@/types';

type SessionFormData = {
    patient_id: string;
    treatment_plan_id: string;
    scheduled_at: string;
    duration: number;
    type: string;
    status: string;
    location: string;
    mood_before: string;
    mood_after: string;
    notes: string;
    homework: string;
};

function nextSessionTime() {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);
    return toDateTimeLocal(date.toISOString());
}

export function SessionFormDialog({
    open,
    onOpenChange,
    session,
    patients,
    plans,
    patientId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session?: TherapySession | null;
    patients: PatientOption[];
    plans: PlanOption[];
    patientId?: number;
}) {
    const form = useForm<SessionFormData>({
        patient_id: '',
        treatment_plan_id: '',
        scheduled_at: nextSessionTime(),
        duration: 50,
        type: 'individual',
        status: 'scheduled',
        location: 'video',
        mood_before: '',
        mood_after: '',
        notes: '',
        homework: '',
    });

    useEffect(() => {
        if (!open) return;
        form.setData(
            session
                ? {
                      patient_id: String(session.patient_id),
                      treatment_plan_id: session.treatment_plan_id
                          ? String(session.treatment_plan_id)
                          : '',
                      scheduled_at: toDateTimeLocal(session.scheduled_at),
                      duration: session.duration,
                      type: session.type,
                      status: session.status,
                      location: session.location,
                      mood_before: session.mood_before?.toString() ?? '',
                      mood_after: session.mood_after?.toString() ?? '',
                      notes: session.notes ?? '',
                      homework: session.homework ?? '',
                  }
                : {
                      patient_id: patientId ? String(patientId) : '',
                      treatment_plan_id: '',
                      scheduled_at: nextSessionTime(),
                      duration: 50,
                      type: 'individual',
                      status: 'scheduled',
                      location: 'video',
                      mood_before: '',
                      mood_after: '',
                      notes: '',
                      homework: '',
                  },
        );
        form.clearErrors();
    }, [open, session?.id, patientId]);

    const availablePlans = plans.filter(
        (plan) => String(plan.patient_id) === form.data.patient_id,
    );
    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };
        if (session) form.put(`/sessions/${session.id}`, options);
        else form.post('/sessions', options);
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={session ? 'Edit session' : 'Schedule a session'}
            description={
                session
                    ? 'Update scheduling details or add documentation.'
                    : 'Set the appointment now; add notes and outcomes after you meet.'
            }
            wide
        >
            <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Patient" error={form.errors.patient_id}>
                        <select
                            required
                            className={selectClass}
                            value={form.data.patient_id}
                            onChange={(e) => {
                                form.setData((data) => ({
                                    ...data,
                                    patient_id: e.target.value,
                                    treatment_plan_id: '',
                                }));
                            }}
                        >
                            <option value="">Select a patient</option>
                            {patients.map((patient) => (
                                <option key={patient.id} value={patient.id}>
                                    {patient.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field
                        label="Treatment plan (optional)"
                        error={form.errors.treatment_plan_id}
                    >
                        <select
                            className={selectClass}
                            value={form.data.treatment_plan_id}
                            onChange={(e) =>
                                form.setData(
                                    'treatment_plan_id',
                                    e.target.value,
                                )
                            }
                            disabled={!form.data.patient_id}
                        >
                            <option value="">No linked plan</option>
                            {availablePlans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.title}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Date & time" error={form.errors.scheduled_at}>
                        <Input
                            type="datetime-local"
                            required
                            value={form.data.scheduled_at}
                            onChange={(e) =>
                                form.setData('scheduled_at', e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field
                        label="Duration (minutes)"
                        error={form.errors.duration}
                    >
                        <Input
                            type="number"
                            min="10"
                            max="240"
                            required
                            value={form.data.duration}
                            onChange={(e) =>
                                form.setData('duration', Number(e.target.value))
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Session type" error={form.errors.type}>
                        <select
                            className={selectClass}
                            value={form.data.type}
                            onChange={(e) =>
                                form.setData('type', e.target.value)
                            }
                        >
                            <option value="individual">
                                Individual therapy
                            </option>
                            <option value="intake">Intake</option>
                            <option value="follow_up">Follow-up</option>
                            <option value="plan_review">Plan review</option>
                        </select>
                    </Field>
                    <Field label="Location" error={form.errors.location}>
                        <select
                            className={selectClass}
                            value={form.data.location}
                            onChange={(e) =>
                                form.setData('location', e.target.value)
                            }
                        >
                            <option value="video">Video call</option>
                            <option value="in_person">In person</option>
                            <option value="phone">Phone</option>
                        </select>
                    </Field>
                </div>
                <Field label="Status" error={form.errors.status}>
                    <select
                        className={selectClass}
                        value={form.data.status}
                        onChange={(e) => form.setData('status', e.target.value)}
                    >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </Field>
                <div className="rounded-2xl border border-[#e4e9e0] bg-white p-4">
                    <div className="mb-4 text-xs font-semibold text-[#425d50]">
                        Session documentation{' '}
                        <span className="ml-1 font-normal text-[#97a198]">
                            · optional
                        </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Mood before · 1–10"
                            error={form.errors.mood_before}
                        >
                            <Input
                                type="number"
                                min="1"
                                max="10"
                                value={form.data.mood_before}
                                onChange={(e) =>
                                    form.setData('mood_before', e.target.value)
                                }
                                className={inputClass}
                                placeholder="e.g. 4"
                            />
                        </Field>
                        <Field
                            label="Mood after · 1–10"
                            error={form.errors.mood_after}
                        >
                            <Input
                                type="number"
                                min="1"
                                max="10"
                                value={form.data.mood_after}
                                onChange={(e) =>
                                    form.setData('mood_after', e.target.value)
                                }
                                className={inputClass}
                                placeholder="e.g. 6"
                            />
                        </Field>
                    </div>
                    <div className="mt-4 space-y-4">
                        <Field label="Session notes" error={form.errors.notes}>
                            <Textarea
                                value={form.data.notes}
                                onChange={(e) =>
                                    form.setData('notes', e.target.value)
                                }
                                className="min-h-24 rounded-xl border-[#dfe5dc]"
                                placeholder="Themes, response, collaborative decisions, and relevant observations…"
                            />
                        </Field>
                        <Field
                            label="Between-session experiment"
                            error={form.errors.homework}
                        >
                            <Textarea
                                value={form.data.homework}
                                onChange={(e) =>
                                    form.setData('homework', e.target.value)
                                }
                                className="min-h-20 rounded-xl border-[#dfe5dc]"
                                placeholder="A small, realistic next step to revisit together…"
                            />
                        </Field>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-[#e6eae3] pt-5">
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={form.processing}
                        className="min-w-30 rounded-xl bg-[#214d40] text-white hover:bg-[#193f34]"
                    >
                        {form.processing && <Spinner />}
                        {session ? 'Save changes' : 'Schedule session'}
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
}
