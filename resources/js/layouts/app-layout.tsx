import type { PropsWithChildren } from 'react';
import AdminLayout from '@/layouts/admin-layout';

/**
 * The admin shell, resolved by `createInertiaApp` for every admin page.
 * Breadcrumbs come from `useBreadcrumbs()` inside the page itself.
 */
export default function AppLayout({ children }: PropsWithChildren) {
    return <AdminLayout>{children}</AdminLayout>;
}
