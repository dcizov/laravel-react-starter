import AdminLayout from '@/layouts/admin-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return <AdminLayout breadcrumbs={breadcrumbs}>{children}</AdminLayout>;
}
