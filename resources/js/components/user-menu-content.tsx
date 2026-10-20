import { Link, router } from '@inertiajs/react';
import { BadgeCheck, LogOut, Palette, Settings, UserRound } from 'lucide-react';
import { ShortcutHint } from '@/components/shortcut-hint';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { useTrans } from '@/hooks/use-trans';
import { edit as editAccount } from '@/routes/account';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { show as showUserProfile } from '@/routes/user-profile';
import type { User } from '@/types';
import { logout } from '@/routes';

type Props = {
    user: User;
};

// The profile menu. The header and the sidebar both render this, so they always match.
export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();
    const t = useTrans();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
                <DropdownMenuItem
                    render={
                        <Link
                            href={showUserProfile()}
                            prefetch
                            onClick={cleanup}
                        />
                    }
                >
                    <UserRound />
                    {t('User profile')}
                    <ShortcutHint id="userProfile" />
                </DropdownMenuItem>
                <DropdownMenuItem
                    render={
                        <Link href={editProfile()} prefetch onClick={cleanup} />
                    }
                >
                    <BadgeCheck />
                    {t('Profile settings')}
                    <ShortcutHint id="profileSettings" />
                </DropdownMenuItem>
                <DropdownMenuItem
                    render={
                        <Link href={editAccount()} prefetch onClick={cleanup} />
                    }
                >
                    <Settings />
                    {t('Account')}
                    <ShortcutHint id="account" />
                </DropdownMenuItem>
                <DropdownMenuItem
                    render={
                        <Link
                            href={editAppearance()}
                            prefetch
                            onClick={cleanup}
                        />
                    }
                >
                    <Palette />
                    {t('Appearance')}
                    <ShortcutHint id="appearance" />
                </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
                variant="destructive"
                nativeButton
                render={
                    <Link
                        href={logout()}
                        as="button"
                        className="w-full"
                        onClick={handleLogout}
                        data-test="logout-button"
                    />
                }
            >
                <LogOut />
                {t('Log out')}
                <ShortcutHint id="logout" />
            </DropdownMenuItem>
        </>
    );
}
