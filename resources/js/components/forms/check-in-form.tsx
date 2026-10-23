import { useForm } from '@inertiajs/react';
import { Battery, Brain, Smile } from 'lucide-react';
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
import type { CheckIn, PatientOption } from '@/types';

type CheckInFormData = {
    patient_id: string;
    checked_in_on: string;
    mood: number;
    energy: number;
    focus: number;
    sleep_hours: string;
    note: string;
};

function RatingField({
    label,
    value,
    onChange,
    icon: Icon,
    color,
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    icon: typeof Smile;
    color: string;
}) {
    return (
        <div className="rounded-2xl border border-[#e5e9e1] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold text-[#50665a]">
                    <Icon className="size-4" style={{ color }} />
                    {label}
                </span>
                <span className="text-lg font-semibold text-[#2f4b3f]">
                    {value}
                    <span className="text-xs font-normal text-[#9aa39b]">
                        /10
                    </span>
                </span>
            </div>
            <input
                aria-label={label}
                type="range"
                min="1"
                max="10"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer"
                style={{ accentColor: color }}
            />
            <div className="mt-2 flex justify-between text-[9px] text-[#9aa39b]">
                <span>Very low</span>
                <span>Very high</span>
            </div>
        </div>
    );
}

export function CheckInFormDialog({
    open,
    onOpenChange,
    checkIn,
    patients,
    patientId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    checkIn?: CheckIn | null;
    patients: PatientOption[];
    patientId?: number;
}) {
    const today = new Date().toISOString().slice(0, 10);
    const form = useForm<CheckInFormData>({
        patient_id: '',
        checked_in_on: today,
        mood: 6,
        energy: 5,
        focus: 5,
        sleep_hours: '7.0',
        note: '',
    });
    useEffect(() => {
        if (!open) return;
        form.setData(
            checkIn
                ? {
                      patient_id: String(checkIn.patient_id),
                      checked_in_on: checkIn.checked_in_on,
                      mood: checkIn.mood,
                      energy: checkIn.energy,
                      focus: checkIn.focus,
                      sleep_hours: checkIn.sleep_hours?.toString() ?? '',
                      note: checkIn.note ?? '',
                  }
                : {
                      patient_id: patientId ? String(patientId) : '',
                      checked_in_on: today,
                      mood: 6,
                      energy: 5,
                      focus: 5,
                      sleep_hours: '7.0',
                      note: '',
                  },
        );
        form.clearErrors();
    }, [open, checkIn?.id, patientId]);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };
        if (checkIn) form.put(`/check-ins/${checkIn.id}`, options);
        else form.post('/check-ins', options);
    };
    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={checkIn ? 'Edit check-in' : 'Record a check-in'}
            description="A brief snapshot of mood and daily functioning—not a diagnostic score."
        >
            <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
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
                    <Field
                        label="Check-in date"
                        error={form.errors.checked_in_on}
                    >
                        <Input
                            type="date"
                            max={today}
                            required
                            value={form.data.checked_in_on}
                            onChange={(e) =>
                                form.setData('checked_in_on', e.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                </div>
                <div className="space-y-3">
                    <RatingField
                        label="Mood"
                        value={form.data.mood}
                        onChange={(value) => form.setData('mood', value)}
                        icon={Smile}
                        color="#bd8168"
                    />
                    <RatingField
                        label="Energy"
                        value={form.data.energy}
                        onChange={(value) => form.setData('energy', value)}
                        icon={Battery}
                        color="#7c966e"
                    />
                    <RatingField
                        label="Focus"
                        value={form.data.focus}
                        onChange={(value) => form.setData('focus', value)}
                        icon={Brain}
                        color="#71899b"
                    />
                </div>
                {(form.errors.mood ||
                    form.errors.energy ||
                    form.errors.focus) && (
                    <p className="text-xs text-red-600">
                        {form.errors.mood ||
                            form.errors.energy ||
                            form.errors.focus}
                    </p>
                )}
                <Field
                    label="Sleep last night (hours)"
                    error={form.errors.sleep_hours}
                >
                    <Input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={form.data.sleep_hours}
                        onChange={(e) =>
                            form.setData('sleep_hours', e.target.value)
                        }
                        className={inputClass}
                    />
                </Field>
                <Field
                    label="A note from the day (optional)"
                    error={form.errors.note}
                >
                    <Textarea
                        value={form.data.note}
                        onChange={(e) => form.setData('note', e.target.value)}
                        className="min-h-20 rounded-xl border-[#dfe5dc]"
                        placeholder="What helped? What felt difficult?"
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
                        className="min-w-30 rounded-xl bg-[#214d40] text-white hover:bg-[#193f34]"
                    >
                        {form.processing && <Spinner />}
                        {checkIn ? 'Save changes' : 'Record check-in'}
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
}
