import { router } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { LanguageSwitcher } from '@/components/language-switcher';
import { NotificationsDropdown } from '@/components/notifications-dropdown';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useTrans } from '@/hooks/use-trans';
import { formatShortcut } from '@/lib/shortcuts';
import { logout } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editAccount } from '@/routes/account';
import { edit as editProfile } from '@/routes/profile';
import { show as showUserProfile } from '@/routes/user-profile';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

// Top bar above the page content: sidebar toggle, breadcrumbs, and quick actions.
export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const t = useTrans();
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    const toggleTheme = () => updateAppearance(isDark ? 'light' : 'dark');

    // The top bar is on every sidebar page, so the shortcuts work everywhere.
    useKeyboardShortcuts({
        userProfile: () => router.get(showUserProfile().url),
        profileSettings: () => router.get(editProfile().url),
        account: () => router.get(editAccount().url),
        appearance: () => router.get(editAppearance().url),
        theme: toggleTheme,
        logout: () => {
            router.flushAll();
            router.post(logout().url);
        },
    });

    return (
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-1" />
            <Separator
                orientation="vertical"
                className="mr-1 data-[orientation=vertical]:h-4"
            />
            <Breadcrumbs breadcrumbs={breadcrumbs} />

            <div className="ml-auto flex items-center gap-1">
                <LanguageSwitcher />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('Toggle theme')}
                    title={`${t('Toggle theme')} (${formatShortcut('theme')})`}
                    onClick={toggleTheme}
                >
                    {isDark ? <Sun /> : <Moon />}
                </Button>
                <NotificationsDropdown />
                <ProfileDropdown />
            </div>
        </header>
    );
}
