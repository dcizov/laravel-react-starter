import type { PageStatus } from '@/lib/sections';

export type PageUrls = {
    edit: string;
    publish: string;
    unpublish: string;
    preview: string | null;
    duplicate: string;
    destroy: string;
    restore: string;
    public: string | null;
};

export type PageRow = {
    id: number;
    title: string;
    slug: string;
    status: PageStatus;
    author: string | null;
    is_trashed: boolean;
    published_at: string | null;
    scheduled_at: string | null;
    updated_at: string | null;
    has_content: boolean;
    urls: PageUrls;
};
