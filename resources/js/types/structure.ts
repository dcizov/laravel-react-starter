export type PatientStatus = 'active' | 'waitlist' | 'discharged';
export type PlanStatus = 'draft' | 'active' | 'completed';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

export type Goal = {
    title: string;
    completed: boolean;
};

export type PatientSummary = {
    id: number;
    name: string;
    initials: string;
};

export type TreatmentPlan = {
    id: number;
    patient_id: number;
    title: string;
    focus: 'adhd' | 'depression' | 'integrated';
    status: PlanStatus;
    start_date: string;
    review_date: string | null;
    progress: number;
    goals: Goal[];
    interventions: string[];
    notes: string | null;
    patient?: PatientSummary | null;
};

export type TherapySession = {
    id: number;
    patient_id: number;
    treatment_plan_id: number | null;
    scheduled_at: string;
    duration: number;
    type: 'individual' | 'intake' | 'follow_up' | 'plan_review';
    status: SessionStatus;
    location: 'video' | 'in_person' | 'phone';
    mood_before: number | null;
    mood_after: number | null;
    notes: string | null;
    homework: string | null;
    patient?: PatientSummary | null;
};

export type CheckIn = {
    id: number;
    patient_id: number;
    checked_in_on: string;
    mood: number;
    energy: number;
    focus: number;
    sleep_hours: number | null;
    note: string | null;
    patient?: PatientSummary | null;
};

export type Patient = {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
    initials: string;
    email: string | null;
    phone: string | null;
    date_of_birth: string | null;
    pronouns: string | null;
    diagnoses: string;
    status: PatientStatus;
    risk_level: 'low' | 'moderate' | 'high';
    notes: string | null;
    emergency_contact: string | null;
    created_at: string;
    sessions_count: number | null;
    latest_check_in: string | null;
    active_plan?: TreatmentPlan | null;
    treatment_plans?: TreatmentPlan[];
    sessions?: TherapySession[];
    check_ins?: CheckIn[];
};

export type PatientOption = {
    id: number;
    name: string;
};

export type PlanOption = {
    id: number;
    patient_id: number;
    title: string;
};

export type TrendPoint = {
    date: string;
    label: string;
    mood: number | null;
    energy: number | null;
};
