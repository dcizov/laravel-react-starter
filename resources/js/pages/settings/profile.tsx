import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import ContentSection from '@/components/settings/content-section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import { useTrans } from '@/hooks/use-trans';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const t = useTrans();
    const getInitials = useInitials();
    const { auth } = usePage().props;
    const user = auth.user;

    const fileInput = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [removeAvatar, setRemoveAvatar] = useState(false);

    const headerInput = useRef<HTMLInputElement>(null);
    const [headerPreview, setHeaderPreview] = useState<string | null>(null);
    const [removeHeader, setRemoveHeader] = useState(false);

    // What the avatar shows right now: a pending upload, the saved avatar, or nothing.
    const shownAvatar = removeAvatar
        ? null
        : (preview ?? user.avatar_url ?? null);

    const chooseFile = (file: File | undefined) => {
        if (!file) {
            return;
        }

        setPreview(URL.createObjectURL(file));
        setRemoveAvatar(false);
    };

    // The header image works the same way as the avatar: pending upload, saved image, or nothing.
    const shownHeader = removeHeader
        ? null
        : (headerPreview ?? user.header_url ?? null);

    const chooseHeader = (file: File | undefined) => {
        if (!file) {
            return;
        }

        setHeaderPreview(URL.createObjectURL(file));
        setRemoveHeader(false);
    };

    const removeHeaderImage = () => {
        if (headerInput.current) {
            headerInput.current.value = '';
        }

        setHeaderPreview(null);
        setRemoveHeader(true);
    };

    const removePicture = () => {
        // Clear the picked file too, so the upload does not win over the removal.
        if (fileInput.current) {
            fileInput.current.value = '';
        }

        setPreview(null);
        setRemoveAvatar(true);
    };

    return (
        <>
            <Head title={t('Profile settings')} />

            <h1 className="sr-only">{t('Profile settings')}</h1>

            <ContentSection
                title={t('Profile')}
                description={t(
                    'Update your name, picture, and the details shown on your profile',
                )}
            >
                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    onSuccess={() => {
                        setPreview(null);
                        setRemoveAvatar(false);
                        setHeaderPreview(null);
                        setRemoveHeader(false);
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <section className="space-y-4">
                                <h2 className="text-sm font-medium">
                                    {t('Images')}
                                </h2>

                                <div className="flex flex-wrap items-center gap-4">
                                    <Avatar className="size-14">
                                        <AvatarImage
                                            src={shownAvatar ?? undefined}
                                            alt={user.name}
                                        />
                                        <AvatarFallback>
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="grid gap-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Input
                                                ref={fileInput}
                                                id="avatar"
                                                name="avatar"
                                                type="file"
                                                accept="image/*"
                                                aria-label={t(
                                                    'Profile picture',
                                                )}
                                                className="max-w-xs"
                                                onChange={(event) =>
                                                    chooseFile(
                                                        event.target.files?.[0],
                                                    )
                                                }
                                            />

                                            {shownAvatar && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={removePicture}
                                                >
                                                    {t('Remove picture')}
                                                </Button>
                                            )}
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                'JPG, PNG, GIF or WebP, up to 2 MB.',
                                            )}
                                        </p>

                                        <InputError message={errors.avatar} />
                                    </div>
                                </div>

                                <input
                                    type="hidden"
                                    name="remove_avatar"
                                    value={removeAvatar ? '1' : '0'}
                                />

                                <div className="grid gap-2">
                                    <div className="relative h-24 w-full overflow-hidden rounded-lg border bg-muted md:h-28">
                                        {shownHeader && (
                                            <img
                                                src={shownHeader}
                                                alt=""
                                                className="size-full object-cover"
                                            />
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Input
                                            ref={headerInput}
                                            id="header"
                                            name="header"
                                            type="file"
                                            accept="image/*"
                                            aria-label={t('Header image')}
                                            className="max-w-xs"
                                            onChange={(event) =>
                                                chooseHeader(
                                                    event.target.files?.[0],
                                                )
                                            }
                                        />

                                        {shownHeader && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={removeHeaderImage}
                                            >
                                                {t('Remove header image')}
                                            </Button>
                                        )}
                                    </div>

                                    <input
                                        type="hidden"
                                        name="remove_header"
                                        value={removeHeader ? '1' : '0'}
                                    />

                                    <p className="text-sm text-muted-foreground">
                                        {t(
                                            'JPG, PNG, GIF or WebP, up to 4 MB.',
                                        )}
                                    </p>

                                    <InputError message={errors.header} />
                                </div>
                            </section>

                            <Separator />

                            <section className="grid gap-4 md:grid-cols-2">
                                <h2 className="text-sm font-medium md:col-span-2">
                                    {t('Personal')}
                                </h2>

                                <div className="grid gap-2">
                                    <Label htmlFor="name">{t('Name')}</Label>
                                    <Input
                                        id="name"
                                        defaultValue={user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder={t('Full name')}
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">
                                        {t('Email address')}
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        defaultValue={user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder={t('Email address')}
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                {mustVerifyEmail &&
                                    user.email_verified_at === null && (
                                        <div className="md:col-span-2">
                                            <p className="text-sm text-muted-foreground">
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
                            </section>

                            <Separator />

                            <section className="grid gap-4 md:grid-cols-2">
                                <h2 className="text-sm font-medium md:col-span-2">
                                    {t('Work')}
                                </h2>

                                <div className="grid gap-2">
                                    <Label htmlFor="job_title">
                                        {t('Job title')}
                                    </Label>
                                    <Input
                                        id="job_title"
                                        name="job_title"
                                        defaultValue={user.job_title ?? ''}
                                        autoComplete="organization-title"
                                        placeholder={t('Product designer')}
                                    />
                                    <InputError message={errors.job_title} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="company">
                                        {t('Company')}
                                    </Label>
                                    <Input
                                        id="company"
                                        name="company"
                                        defaultValue={user.company ?? ''}
                                        autoComplete="organization"
                                        placeholder={t('Acme Inc.')}
                                    />
                                    <InputError message={errors.company} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="location">
                                        {t('Location')}
                                    </Label>
                                    <Input
                                        id="location"
                                        name="location"
                                        defaultValue={user.location ?? ''}
                                        autoComplete="address-level2"
                                        placeholder={t('Hannover, Germany')}
                                    />
                                    <InputError message={errors.location} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="website">
                                        {t('Website')}
                                    </Label>
                                    <Input
                                        id="website"
                                        name="website"
                                        type="url"
                                        defaultValue={user.website ?? ''}
                                        autoComplete="url"
                                        placeholder="https://example.com"
                                    />
                                    <InputError message={errors.website} />
                                </div>
                            </section>

                            <Separator />

                            <section className="grid gap-2">
                                <h2 className="text-sm font-medium">
                                    {t('About')}
                                </h2>
                                <Label htmlFor="bio" className="sr-only">
                                    {t('Bio')}
                                </Label>
                                <Textarea
                                    id="bio"
                                    name="bio"
                                    rows={4}
                                    maxLength={500}
                                    defaultValue={user.bio ?? ''}
                                    placeholder={t(
                                        'A few words about you and what you work on.',
                                    )}
                                />
                                <p className="text-sm text-muted-foreground">
                                    {t('Up to 500 characters.')}
                                </p>
                                <InputError message={errors.bio} />
                            </section>

                            <div className="flex items-center gap-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    {processing && <Spinner />}
                                    {t('Save')}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </ContentSection>
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
