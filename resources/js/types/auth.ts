export type User = {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
    header_url?: string | null;
    bio?: string | null;
    job_title?: string | null;
    company?: string | null;
    location?: string | null;
    website?: string | null;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    date_of_birth?: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    permissions: string[];
};

export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
