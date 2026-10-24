import type { PropsWithChildren } from 'react';
import { AdminTopBar } from '@/components/admin-top-bar';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { BreadcrumbsProvider } from '@/components/breadcrumbs-context';

/**
 * The admin shell: DB-driven sidebar, sticky top bar with breadcrumbs,
 * notifications, theme switch and user menu.
 *
 * It is resolved once by `createInertiaApp` for every admin page, so the
 * sidebar and its state survive navigation. Pages publish their breadcrumb
 * trail through `useBreadcrumbs()` instead of passing it in as a prop.
 */
export default function AdminLayout({ children }: PropsWithChildren) {
    return (
        <BreadcrumbsProvider>
            <AppShell variant="sidebar">
                <a
                    href="#main-content"
                    className="sr-only bg-background focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:text-sm focus:ring-2 focus:ring-ring"
                >
                    Skip to content
                </a>
                <AppSidebar />
                {/* One landmark: SidebarInset renders the <main>. Nesting a
                    second one inside it would give screen readers two. */}
                <AppContent
                    variant="sidebar"
                    id="main-content"
                    tabIndex={-1}
                    aria-label="Main content"
                    className="min-w-0 overflow-x-clip"
                >
                    <AdminTopBar />
                    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
                        {children}
                    </div>
                </AppContent>
            </AppShell>
        </BreadcrumbsProvider>
    );
}
