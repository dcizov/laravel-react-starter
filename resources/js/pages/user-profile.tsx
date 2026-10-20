import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarDays, Globe, Mail, MapPin, Pencil } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInitials } from '@/hooks/use-initials';
import { useTrans } from '@/hooks/use-trans';
import { edit as editProfile } from '@/routes/profile';
import { show } from '@/routes/user-profile';

export default function UserProfile() {
    const t = useTrans();
    const getInitials = useInitials();
    const { auth, locale, timezone } = usePage().props;
    const user = auth.user;

    const memberSince = new Intl.DateTimeFormat(locale, {
        dateStyle: 'long',
        timeZone: timezone,
    }).format(new Date(user.created_at));

    const websiteLabel = user.website
        ? user.website.replace(/^https?:\/\//, '').replace(/\/$/, '')
        : null;

    const subtitle = [user.job_title, user.company].filter(Boolean).join(' · ');

    return (
        <>
            <Head title={t('User profile')} />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-xl border">
                    <div
                        className="h-32 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-300 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-900"
                        aria-hidden="true"
                    />

                    <div className="px-6 pb-6">
                        <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
                            <Avatar className="size-24 border-4 border-background text-2xl">
                                <AvatarImage
                                    src={user.avatar_url ?? undefined}
                                    alt={user.name}
                                />
                                <AvatarFallback>
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>

                            <Button
                                variant="outline"
                                render={<Link href={editProfile()} />}
                            >
                                <Pencil />
                                {t('Edit profile')}
                            </Button>
                        </div>

                        <div className="mt-4 space-y-1">
                            <h1 className="text-2xl font-semibold">
                                {user.name}
                            </h1>
                            {subtitle && (
                                <p className="text-muted-foreground">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {user.bio ? (
                            <p className="mt-4 max-w-2xl whitespace-pre-line">
                                {user.bio}
                            </p>
                        ) : (
                            <p className="mt-4 text-muted-foreground">
                                {t(
                                    'No bio yet. Add one in your profile settings.',
                                )}
                            </p>
                        )}
                    </div>
                </section>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('Details')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-4 text-sm sm:grid-cols-2">
                            <div className="flex items-start gap-3">
                                <Mail className="mt-0.5 size-4 text-muted-foreground" />
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('Email address')}
                                    </dt>
                                    <dd className="font-medium break-all">
                                        {user.email}
                                    </dd>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="mt-0.5 size-4 text-muted-foreground" />
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('Location')}
                                    </dt>
                                    <dd className="font-medium">
                                        {user.location || t('Not set')}
                                    </dd>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Globe className="mt-0.5 size-4 text-muted-foreground" />
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('Website')}
                                    </dt>
                                    <dd className="font-medium break-all">
                                        {user.website && websiteLabel ? (
                                            <a
                                                href={user.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline underline-offset-4"
                                            >
                                                {websiteLabel}
                                            </a>
                                        ) : (
                                            t('Not set')
                                        )}
                                    </dd>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('Member since')}
                                    </dt>
                                    <dd className="font-medium">
                                        {memberSince}
                                    </dd>
                                </div>
                            </div>
                        </dl>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

UserProfile.layout = {
    breadcrumbs: [
        {
            title: 'User profile',
            href: show(),
        },
    ],
};
