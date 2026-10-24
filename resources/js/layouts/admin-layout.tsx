import { AdminTopBar } from '@/components/admin-top-bar';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import type { AppLayoutProps } from '@/types';

/**
 * The admin shell: DB-driven sidebar (static registry until the addon milestone),
 * sticky top bar with breadcrumbs, notifications, theme switch and user menu.
 */
export default function AdminLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="min-w-0 overflow-x-clip">
                <AdminTopBar breadcrumbs={breadcrumbs} />
                <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
                    {children}
                </main>
            </AppContent>
        </AppShell>
    );
}
