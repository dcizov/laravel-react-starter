import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import ContentSection from '@/components/settings/content-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTrans } from '@/hooks/use-trans';
import { edit } from '@/routes/profile';
import { edit as editAccount } from '@/routes/account';
import { send } from '@/routes/verification';

// Age in whole years from a 'YYYY-MM-DD' date of birth.
function ageFrom(dateOfBirth: string, today = new Date()): number {
    const [year, month, day] = dateOfBirth.slice(0, 10).split('-').map(Number);
    const hadBirthday =
        today.getMonth() + 1 > month ||
        (today.getMonth() + 1 === month && today.getDate() >= day);

    return today.getFullYear() - year - (hadBirthday ? 0 : 1);
}

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const t = useTrans();
    const { auth, locale, timezone } = usePage().props;
    const dateOfBirth = auth.user.date_of_birth ?? null;

    // Show the saved language and timezone here, so the profile reflects them.
    const languageName =
        new Intl.DisplayNames([locale], { type: 'language' }).of(locale) ??
        locale;
    const localTime = new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: timezone,
    }).format(new Date());

    return (
        <>
            <Head title={t('Profile settings')} />

            <h1 className="sr-only">{t('Profile settings')}</h1>

            <ContentSection
                title={t('Profile')}
                description={t('Update your name and email address')}
            >
                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('Name')}</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder={t('Full name')}
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    {t('Email address')}
                                </Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder={t('Email address')}
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            {t(
                                                'Your email address is unverified.',
                                            )}{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                {t(
                                                    'Click here to re-send the verification email.',
                                                )}
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                {t(
                                                    'A new verification link has been sent to your email address.',
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    {t('Save')}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </ContentSection>

            <ContentSection
                title={t('Your preferences')}
                description={t(
                    'These come from your account settings. Change them there.',
                )}
            >
                <dl className="grid gap-4 text-sm">
                    <div>
                        <dt className="text-muted-foreground">
                            {t('Language')}
                        </dt>
                        <dd className="font-medium">{languageName}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">
                            {t('Timezone')}
                        </dt>
                        <dd className="font-medium">{timezone}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">
                            {t('Local time')}
                        </dt>
                        <dd className="font-medium">{localTime}</dd>
                    </div>
                    {dateOfBirth && (
                        <div>
                            <dt className="text-muted-foreground">
                                {t('Age')}
                            </dt>
                            <dd className="font-medium">
                                {ageFrom(dateOfBirth)}
                            </dd>
                        </div>
                    )}
                </dl>
                <Link
                    href={editAccount()}
                    className="text-sm underline underline-offset-4"
                >
                    {t('Edit in account settings')}
                </Link>
            </ContentSection>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
