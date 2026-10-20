// A user as the Users page receives them. The role is the one name the user has.
export type AccountUser = {
    id: number;
    name: string;
    email: string;
    role: string;
};

// Role names come from the server. Labels for the ones the app knows are translated where shown.
export const roleLabels: Record<string, string> = {
    admin: 'Admin',
    user: 'User',
};
