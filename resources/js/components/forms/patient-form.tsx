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
import type { Patient } from '@/types';

type PatientFormData = {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    pronouns: string;
    diagnoses: string;
    status: string;
    risk_level: string;
    notes: string;
    emergency_contact: string;
};

const blank: PatientFormData = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    pronouns: '',
    diagnoses: '',
    status: 'active',
    risk_level: 'low',
    notes: '',
    emergency_contact: '',
};

export function PatientFormDialog({
    open,
    onOpenChange,
    patient,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patient?: Patient | null;
}) {
    const form = useForm<PatientFormData>(blank);

    useEffect(() => {
        if (!open) return;
        form.setData(
            patient
                ? {
                      first_name: patient.first_name,
                      last_name: patient.last_name,
                      email: patient.email ?? '',
                      phone: patient.phone ?? '',
                      date_of_birth: patient.date_of_birth ?? '',
                      pronouns: patient.pronouns ?? '',
                      diagnoses: patient.diagnoses,
                      status: patient.status,
                      risk_level: patient.risk_level,
                      notes: patient.notes ?? '',
                      emergency_contact: patient.emergency_contact ?? '',
                  }
                : blank,
        );
        form.clearErrors();
    }, [open, patient?.id]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        };
        if (patient) form.put(`/patients/${patient.id}`, options);
        else form.post('/patients', options);
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={patient ? 'Edit patient details' : 'Add a new patient'}
            description={
                patient
                    ? 'Keep contact and clinical context up to date.'
                    : 'Create a record, then connect a treatment plan and sessions.'
            }
            wide
        >
            <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="First name" error={form.errors.first_name}>
                        <Input
                            autoFocus
                            required
                            value={form.data.first_name}
                            onChange={(e) =>
                                form.setData('first_name', e.target.value)
                            }
                            className={inputClass}
                            placeholder="First name"
                        />
                    </Field>
                    <Field label="Last name" error={form.errors.last_name}>
                        <Input
                            required
                            value={form.data.last_name}
                            onChange={(e) =>
                                form.setData('last_name', e.target.value)
                            }
                            className={inputClass}
                            placeholder="Last name"
                        />
                    </Field>
                    <Field label="Email address" error={form.errors.email}>
                        <Input
                            type="email"
                            value={form.data.email}
                            onChange={(e) =>
                                form.setData('email', e.target.value)
                            }
                            className={inputClass}
                            placeholder="patient@example.com"
                        />
                    </Field>
                    <Field label="Phone" error={form.errors.phone}>
                        <Input
                            value={form.data.phone}
                            onChange={(e) =>
                                form.setData('phone', e.target.value)
                            }
                            className={inputClass}
                            placeholder="+49 151 0000 0000"
                        />
                    </Field>
                    <Field
                        label="Date of birth"
                        error={form.errors.date_of_birth}
                    >
                        <Input
                            type="date"
                            value={form.data.date_of_birth}
                            onChange={(e) =>
                                form.setData('date_of_birth', e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field
                        label="Pronouns (optional)"
                        error={form.errors.pronouns}
                    >
                        <Input
                            value={form.data.pronouns}
                            onChange={(e) =>
                                form.setData('pronouns', e.target.value)
                            }
                            className={inputClass}
                            placeholder="e.g. she/her"
                        />
                    </Field>
                </div>
                <Field
                    label="Diagnoses / areas of focus"
                    error={form.errors.diagnoses}
                >
                    <Textarea
                        required
                        value={form.data.diagnoses}
                        onChange={(e) =>
                            form.setData('diagnoses', e.target.value)
                        }
                        className="min-h-20 rounded-xl border-[#dfe5dc]"
                        placeholder="e.g. ADHD, combined presentation; depressive episode"
                    />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Care status" error={form.errors.status}>
                        <select
                            className={selectClass}
                            value={form.data.status}
                            onChange={(e) =>
                                form.setData('status', e.target.value)
                            }
                        >
                            <option value="active">Active</option>
                            <option value="waitlist">Waitlist</option>
                            <option value="discharged">Discharged</option>
                        </select>
                    </Field>
                    <Field
                        label="Current risk level"
                        error={form.errors.risk_level}
                    >
                        <select
                            className={selectClass}
                            value={form.data.risk_level}
                            onChange={(e) =>
                                form.setData('risk_level', e.target.value)
                            }
                        >
                            <option value="low">Low</option>
                            <option value="moderate">Moderate</option>
                            <option value="high">High</option>
                        </select>
                    </Field>
                </div>
                <Field
                    label="Emergency contact (optional)"
                    error={form.errors.emergency_contact}
                >
                    <Input
                        value={form.data.emergency_contact}
                        onChange={(e) =>
                            form.setData('emergency_contact', e.target.value)
                        }
                        className={inputClass}
                        placeholder="Name, relationship and phone"
                    />
                </Field>
                <Field
                    label="Clinical context & strengths"
                    error={form.errors.notes}
                >
                    <Textarea
                        value={form.data.notes}
                        onChange={(e) => form.setData('notes', e.target.value)}
                        className="min-h-24 rounded-xl border-[#dfe5dc]"
                        placeholder="Helpful context, preferences, strengths, and considerations…"
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
                        {patient ? 'Save changes' : 'Add patient'}
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
}
