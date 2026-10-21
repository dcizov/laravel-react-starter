// A user as the directory page receives them. The role is the one name the user has.
export type AccountUser = {
    id: number;
    name: string;
    email: string;
    role: string;
};

// A user as the admin page receives them. It adds what only administrators see.
export type AdminUser = AccountUser & {
    verified: boolean;
    verifiedAt: string | null;
    suspended: boolean;
    createdAt: string | null;
    tasksCount: number;
};

// One row of the audit log, as the audit log page receives it.
export type AuditEntry = {
    id: number;
    createdAt: string | null;
    actor: string;
    impersonator: string | null;
    action: string;
    subject: string;
    ipAddress: string;
    details: string;
};

// Role names come from the server. Labels for the ones the app knows are translated where shown.
export const roleLabels: Record<string, string> = {
    admin: 'Admin',
    user: 'User',
};

// A date and time in the user's timezone, as set in the profile.
export function formatDateTime(value: string | null, timezone: string): string {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: timezone,
    }).format(new Date(value));
}
