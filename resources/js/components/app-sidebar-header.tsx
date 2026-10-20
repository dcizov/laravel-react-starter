import { router, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { CommandSearch } from '@/components/command-search';
import { LanguageSwitcher } from '@/components/language-switcher';
import { NotificationsDropdown } from '@/components/notifications-dropdown';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useTrans } from '@/hooks/use-trans';
import { isMac, modifierKeys } from '@/lib/shortcuts';
import { cn } from '@/lib/utils';
import { edit as editAccount } from '@/routes/account';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { show as showUserProfile } from '@/routes/user-profile';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { logout } from '@/routes';

// Top bar above the page content: sidebar toggle, breadcrumbs, search, and quick actions.
export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const t = useTrans();
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const [searchOpen, setSearchOpen] = useState(false);
    const { sidebarVariant } = usePage().props;

    const toggleTheme = () =>
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');

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

    // Cmd/Ctrl+K opens search, as in shadcn-lar.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const modifier = isMac() ? event.metaKey : event.ctrlKey;

            if (
                modifier &&
                !event.shiftKey &&
                !event.altKey &&
                event.key.toLowerCase() === 'k'
            ) {
                event.preventDefault();
                setSearchOpen((open) => !open);
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <header
            className={cn(
                'sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-background px-4',
                // A floating sidebar sits on its own card, so the top bar needs no divider line.
                sidebarVariant !== 'floating' && 'border-b',
            )}
        >
            <SidebarTrigger className="-ml-1" />
            <Separator
                orientation="vertical"
                className="mx-1 h-4 w-px bg-foreground/20"
            />
            <Breadcrumbs breadcrumbs={breadcrumbs} />

            <div className="ml-auto flex items-center gap-1">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={t('Search')}
                    onClick={() => setSearchOpen(true)}
                    className="mr-1 h-8 justify-start bg-muted/25 font-normal text-muted-foreground shadow-none hover:bg-muted/50 md:w-48 lg:w-64"
                >
                    <Search aria-hidden="true" className="size-4" />
                    <span className="hidden md:inline">{t('Search')}</span>
                    <KbdGroup className="ml-auto hidden md:inline-flex">
                        {[...modifierKeys(), 'K'].map((key) => (
                            <Kbd key={key}>{key}</Kbd>
                        ))}
                    </KbdGroup>
                </Button>
                <LanguageSwitcher />
                <ThemeSwitch />
                <NotificationsDropdown />
                <ProfileDropdown />
            </div>

            <CommandSearch
                open={searchOpen}
                onOpenChange={setSearchOpen}
                onToggleTheme={toggleTheme}
            />
        </header>
    );
}
