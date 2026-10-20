import { Link, router, usePage } from '@inertiajs/react';
import { BadgeCheck, LogOut, Settings, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useInitials } from '@/hooks/use-initials';
import { useTrans } from '@/hooks/use-trans';
import { formatShortcut } from '@/lib/shortcuts';
import { logout } from '@/routes';
import { edit as editAccount } from '@/routes/account';
import { edit as editProfile } from '@/routes/profile';
import { edit as editAppearance } from '@/routes/appearance';
import { show as showUserProfile } from '@/routes/user-profile';

// Profile menu in the top bar, modelled on shadcn-lar's profile dropdown.
export function ProfileDropdown() {
    const t = useTrans();
    const getInitials = useInitials();
    const { auth } = usePage().props;
    const user = auth.user;

    if (!user) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        aria-label={t('Open profile menu')}
                        data-test="profile-dropdown-trigger"
                    />
                }
            >
                <Avatar className="size-8">
                    <AvatarImage
                        src={user.avatar_url ?? undefined}
                        alt={user.name}
                    />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-64 min-w-56" align="end">
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <UserInfo user={user} showEmail={true} />
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <DropdownMenuItem
                        render={<Link href={showUserProfile()} prefetch />}
                    >
                        <UserRound />
                        {t('User profile')}
                        <DropdownMenuShortcut>
                            {formatShortcut('userProfile')}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        render={<Link href={editProfile()} prefetch />}
                    >
                        <BadgeCheck />
                        {t('Profile settings')}
                        <DropdownMenuShortcut>
                            {formatShortcut('profileSettings')}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        render={<Link href={editAccount()} prefetch />}
                    >
                        <Settings />
                        {t('Account')}
                        <DropdownMenuShortcut>
                            {formatShortcut('account')}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        render={<Link href={editAppearance()} prefetch />}
                    >
                        <Settings />
                        {t('Appearance')}
                        <DropdownMenuShortcut>
                            {formatShortcut('appearance')}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    variant="destructive"
                    render={
                        <Link
                            href={logout()}
                            as="button"
                            className="w-full"
                            onClick={() => router.flushAll()}
                            data-test="logout-button"
                        />
                    }
                >
                    <LogOut />
                    {t('Log out')}
                    <DropdownMenuShortcut>
                        {formatShortcut('logout')}
                    </DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
