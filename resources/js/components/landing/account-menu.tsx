// Sign-in state for the navigation bar on the public page: an avatar menu for signed-in visitors,
// and a Log in link for guests. The visual editor does not provide the context, so it shows nothing here.
import { Link } from '@inertiajs/react';
import { LayoutDashboard } from 'lucide-react';
import { createContext, use } from 'react';
import { LandingEditContext } from '@/components/landing/landing-edit';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { useTrans } from '@/hooks/use-trans';
import type { User } from '@/types';
import { dashboard, login } from '@/routes';

export const AccountContext = createContext<{ user: User | null } | null>(null);

// Desktop: an avatar button with the profile menu and a dashboard link. Guests see a Log in link.
export function AccountMenu() {
    const edit = use(LandingEditContext);
    const account = use(AccountContext);
    const t = useTrans();
    const getInitials = useInitials();

    if (edit || !account) {
        return null;
    }

    if (!account.user) {
        return (
            <Link
                href={login()}
                className="text-sm font-medium whitespace-nowrap hover:underline"
            >
                {t('Log in')}
            </Link>
        );
    }

    const user = account.user;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <button
                        type="button"
                        aria-label={t('Account menu')}
                        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <DropdownMenuContent align="end" className="w-64 rounded-lg">
                <DropdownMenuItem render={<Link href={dashboard()} />}>
                    <LayoutDashboard />
                    {t('Dashboard')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <UserMenuContent user={user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// The same choice as a plain link list, for the mobile menu.
export function AccountLinks() {
    const edit = use(LandingEditContext);
    const account = use(AccountContext);
    const t = useTrans();

    if (edit || !account) {
        return null;
    }

    return account.user ? (
        <Link href={dashboard()} className="text-sm font-medium">
            {t('Dashboard')}
        </Link>
    ) : (
        <Link href={login()} className="text-sm font-medium">
            {t('Log in')}
        </Link>
    );
}
