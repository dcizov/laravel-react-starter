import { usePage } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { useTrans } from '@/hooks/use-trans';

// Avatar button in the top bar. Its menu is the same one the sidebar shows.
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
                <UserMenuContent user={user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
