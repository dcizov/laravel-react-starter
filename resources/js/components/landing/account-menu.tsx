// Sign-in controls for the navigation bar. Signed-in visitors get the same profile menu as the app header,
// with a dashboard link under their name. Guests get a Log in link. The visual editor shows neither,
// so the canvas stays simple.
import { Link, usePage } from '@inertiajs/react';
import { use } from 'react';
import { LandingEditContext } from '@/components/landing/landing-edit';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { useTrans } from '@/hooks/use-trans';
import { dashboard, login } from '@/routes';

// Whether the visitor is signed in on the public page. The editor is never treated as signed in for the
// navigation bar, so its call to action stays editable.
export function useSignedInOnPublicPage(): boolean {
    const edit = use(LandingEditContext);
    const { auth } = usePage().props;

    return !edit && Boolean(auth.user);
}

// Desktop: the profile menu for signed-in visitors, or a Log in link for guests.
export function AccountMenu() {
    const edit = use(LandingEditContext);
    const { auth } = usePage().props;
    const t = useTrans();

    if (edit) {
        return null;
    }

    if (!auth.user) {
        return (
            <Link
                href={login()}
                className="text-sm font-medium whitespace-nowrap hover:underline"
            >
                {t('Log in')}
            </Link>
        );
    }

    return <ProfileDropdown dashboardLink />;
}

// The same choice as plain links, for the mobile menu.
export function AccountLinks() {
    const edit = use(LandingEditContext);
    const { auth } = usePage().props;
    const t = useTrans();

    if (edit) {
        return null;
    }

    return auth.user ? (
        <Link href={dashboard()} className="text-sm font-medium">
            {t('Dashboard')}
        </Link>
    ) : (
        <Link href={login()} className="text-sm font-medium">
            {t('Log in')}
        </Link>
    );
}
