import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarDays, Globe, Mail, MapPin, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInitials } from '@/hooks/use-initials';
import { useTrans } from '@/hooks/use-trans';
import { edit as editProfile } from '@/routes/profile';
import { show } from '@/routes/user-profile';

type DetailProps = {
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    label: string;
    children: React.ReactNode;
};

function Detail({ icon: Icon, label, children }: DetailProps) {
    return (
        <div className="flex items-start gap-3">
            <Icon
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <div className="min-w-0 space-y-1">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium break-words">{children}</dd>
            </div>
        </div>
    );
}

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

    // The header image shows a skeleton until the browser has loaded it.
    const [headerLoaded, setHeaderLoaded] = useState(false);

    const subtitle = [user.job_title, user.company].filter(Boolean).join(' · ');

    return (
        <>
            <Head title={t('User profile')} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                    <Card className="gap-0 overflow-hidden p-0">
                        <div className="relative h-24 bg-muted md:h-32">
                            {user.header_url && (
                                <>
                                    {!headerLoaded && (
                                        <Skeleton className="absolute inset-0 rounded-none" />
                                    )}
                                    <img
                                        src={user.header_url}
                                        alt=""
                                        onLoad={() => setHeaderLoaded(true)}
                                        className={`size-full object-cover ${headerLoaded ? '' : 'invisible'}`}
                                    />
                                </>
                            )}
                        </div>

                        <div className="px-4 pb-6 md:px-6">
                            <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
                                <Avatar className="size-24 text-2xl ring-4 ring-card">
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
                                    size="sm"
                                    render={<Link href={editProfile()} />}
                                >
                                    <Pencil data-icon="inline-start" />
                                    {t('Edit profile')}
                                </Button>
                            </div>

                            <div className="mt-4 space-y-1">
                                <h1 className="text-2xl font-semibold break-words">
                                    {user.name}
                                </h1>
                                {subtitle && (
                                    <p className="text-muted-foreground">
                                        {subtitle}
                                    </p>
                                )}
                            </div>

                            {user.bio ? (
                                <p className="mt-4 max-w-prose whitespace-pre-line">
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
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Details')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-6 text-sm sm:grid-cols-2">
                                <Detail icon={Mail} label={t('Email address')}>
                                    <span className="break-all">
                                        {user.email}
                                    </span>
                                </Detail>

                                <Detail icon={MapPin} label={t('Location')}>
                                    {user.location || (
                                        <span className="text-muted-foreground">
                                            {t('Not set')}
                                        </span>
                                    )}
                                </Detail>

                                <Detail icon={Globe} label={t('Website')}>
                                    {user.website && websiteLabel ? (
                                        <a
                                            href={user.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="break-all underline underline-offset-4"
                                        >
                                            {websiteLabel}
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            {t('Not set')}
                                        </span>
                                    )}
                                </Detail>

                                <Detail
                                    icon={CalendarDays}
                                    label={t('Member since')}
                                >
                                    {memberSince}
                                </Detail>
                            </dl>
                        </CardContent>
                    </Card>
                </div>
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
