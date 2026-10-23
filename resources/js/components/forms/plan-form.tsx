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
import type { PatientOption, TreatmentPlan } from '@/types';

type PlanFormData = {
    patient_id: string;
    title: string;
    focus: string;
    status: string;
    start_date: string;
    review_date: string;
    progress: number;
    goals_text: string;
    interventions_text: string;
    notes: string;
};

export function PlanFormDialog({
    open,
    onOpenChange,
    plan,
    patients,
    patientId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan?: TreatmentPlan | null;
    patients: PatientOption[];
    patientId?: number;
}) {
    const today = new Date().toISOString().slice(0, 10);
    const form = useForm<PlanFormData>({
        patient_id: '',
        title: '',
        focus: 'integrated',
        status: 'active',
        start_date: today,
        review_date: '',
        progress: 0,
        goals_text: '',
        interventions_text: '',
        notes: '',
    });

    useEffect(() => {
        if (!open) return;
        form.setData(
            plan
                ? {
                      patient_id: String(plan.patient_id),
                      title: plan.title,
                      focus: plan.focus,
                      status: plan.status,
                      start_date: plan.start_date,
                      review_date: plan.review_date ?? '',
                      progress: plan.progress,
                      goals_text: plan.goals
                          .map((goal) => goal.title)
                          .join('\n'),
                      interventions_text: plan.interventions.join('\n'),
                      notes: plan.notes ?? '',
                  }
                : {
                      patient_id: patientId ? String(patientId) : '',
                      title: '',
                      focus: 'integrated',
                      status: 'active',
                      start_date: today,
                      review_date: '',
                      progress: 0,
                      goals_text: '',
                      interventions_text: '',
                      notes: '',
                  },
        );
        form.clearErrors();
    }, [open, plan?.id, patientId]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };
        if (plan) form.put(`/plans/${plan.id}`, options);
        else form.post('/plans', options);
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={plan ? 'Edit treatment plan' : 'Create a treatment plan'}
            description="Turn shared priorities into clear, flexible goals and interventions."
            wide
        >
            <form onSubmit={submit} className="space-y-5">
                <Field label="Patient" error={form.errors.patient_id}>
                    <select
                        required
                        className={selectClass}
                        value={form.data.patient_id}
                        onChange={(e) =>
                            form.setData('patient_id', e.target.value)
                        }
                    >
                        <option value="">Select a patient</option>
                        {patients.map((patient) => (
                            <option key={patient.id} value={patient.id}>
                                {patient.name}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Plan title" error={form.errors.title}>
                    <Input
                        autoFocus
                        required
                        value={form.data.title}
                        onChange={(e) => form.setData('title', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. Daily structure & emotional wellbeing"
                    />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Primary focus" error={form.errors.focus}>
                        <select
                            className={selectClass}
                            value={form.data.focus}
                            onChange={(e) =>
                                form.setData('focus', e.target.value)
                            }
                        >
                            <option value="integrated">
                                ADHD & depression
                            </option>
                            <option value="adhd">ADHD</option>
                            <option value="depression">Depression</option>
                        </select>
                    </Field>
                    <Field label="Status" error={form.errors.status}>
                        <select
                            className={selectClass}
                            value={form.data.status}
                            onChange={(e) =>
                                form.setData('status', e.target.value)
                            }
                        >
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="completed">Completed</option>
                        </select>
                    </Field>
                    <Field label="Start date" error={form.errors.start_date}>
                        <Input
                            type="date"
                            required
                            value={form.data.start_date}
                            onChange={(e) =>
                                form.setData('start_date', e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Next review" error={form.errors.review_date}>
                        <Input
                            type="date"
                            value={form.data.review_date}
                            onChange={(e) =>
                                form.setData('review_date', e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                </div>
                <Field
                    label={`Overall progress · ${form.data.progress}%`}
                    error={form.errors.progress}
                >
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={form.data.progress}
                        onChange={(e) =>
                            form.setData('progress', Number(e.target.value))
                        }
                        className="mt-2 h-1.5 w-full cursor-pointer accent-[#55765e]"
                    />
                    <div className="mt-1 flex justify-between text-[10px] font-normal text-[#9aa39b]">
                        <span>Just beginning</span>
                        <span>Goals consolidated</span>
                    </div>
                </Field>
                <Field
                    label="Goals · one per line"
                    error={form.errors.goals_text}
                >
                    <Textarea
                        value={form.data.goals_text}
                        onChange={(e) =>
                            form.setData('goals_text', e.target.value)
                        }
                        className="min-h-28 rounded-xl border-[#dfe5dc]"
                        placeholder={
                            'Use a five-minute start ritual\nSchedule one pleasant activity each week\nPractice a grounding exercise'
                        }
                    />
                </Field>
                <Field
                    label="Interventions · one per line"
                    error={form.errors.interventions_text}
                >
                    <Textarea
                        value={form.data.interventions_text}
                        onChange={(e) =>
                            form.setData('interventions_text', e.target.value)
                        }
                        className="min-h-24 rounded-xl border-[#dfe5dc]"
                        placeholder={
                            'Behavioral activation\nExternal structure and task breakdown\nCompassion-focused reframing'
                        }
                    />
                </Field>
                <Field label="Plan notes (optional)" error={form.errors.notes}>
                    <Textarea
                        value={form.data.notes}
                        onChange={(e) => form.setData('notes', e.target.value)}
                        className="min-h-20 rounded-xl border-[#dfe5dc]"
                        placeholder="Pacing, preferences, review considerations…"
                    />
                </Field>
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
                        className="min-w-28 rounded-xl bg-[#214d40] text-white hover:bg-[#193f34]"
                    >
                        {form.processing && <Spinner />}
                        {plan ? 'Save changes' : 'Create plan'}
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
}
