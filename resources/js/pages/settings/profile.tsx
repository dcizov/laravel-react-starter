import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import ContentSection from '@/components/settings/content-section';
import { StatusAlert } from '@/components/status-alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
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
                    setDefaultsOnSuccess
                    className="space-y-6"
                >
                    {({ processing, errors, isDirty }) => (
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

                                        <FieldError>{errors.avatar}</FieldError>
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

                                    <FieldError>{errors.header}</FieldError>
                                </div>
                            </section>

                            <Separator />

                            <section className="grid gap-4 md:grid-cols-2">
                                <h2 className="text-sm font-medium md:col-span-2">
                                    {t('Personal')}
                                </h2>

                                <Field data-invalid={!!errors.name}>
                                    <FieldLabel htmlFor="name">
                                        {t('Name')}
                                    </FieldLabel>
                                    <Input
                                        id="name"
                                        defaultValue={user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder={t('Full name')}
                                    />
                                    <FieldError>{errors.name}</FieldError>
                                </Field>

                                <Field data-invalid={!!errors.email}>
                                    <FieldLabel htmlFor="email">
                                        {t('Email address')}
                                    </FieldLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        defaultValue={user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder={t('Email address')}
                                    />
                                    <FieldError>{errors.email}</FieldError>
                                </Field>

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
                                                <StatusAlert className="mt-2">
                                                    {t(
                                                        'A new verification link has been sent to your email address.',
                                                    )}
                                                </StatusAlert>
                                            )}
                                        </div>
                                    )}
                            </section>

                            <Separator />

                            <section className="grid gap-4 md:grid-cols-2">
                                <h2 className="text-sm font-medium md:col-span-2">
                                    {t('Work')}
                                </h2>

                                <Field data-invalid={!!errors.job_title}>
                                    <FieldLabel htmlFor="job_title">
                                        {t('Job title')}
                                    </FieldLabel>
                                    <Input
                                        id="job_title"
                                        name="job_title"
                                        defaultValue={user.job_title ?? ''}
                                        autoComplete="organization-title"
                                        placeholder={t('Product designer')}
                                    />
                                    <FieldError>{errors.job_title}</FieldError>
                                </Field>

                                <Field data-invalid={!!errors.company}>
                                    <FieldLabel htmlFor="company">
                                        {t('Company')}
                                    </FieldLabel>
                                    <Input
                                        id="company"
                                        name="company"
                                        defaultValue={user.company ?? ''}
                                        autoComplete="organization"
                                        placeholder={t('Acme Inc.')}
                                    />
                                    <FieldError>{errors.company}</FieldError>
                                </Field>

                                <Field data-invalid={!!errors.location}>
                                    <FieldLabel htmlFor="location">
                                        {t('Location')}
                                    </FieldLabel>
                                    <Input
                                        id="location"
                                        name="location"
                                        defaultValue={user.location ?? ''}
                                        autoComplete="address-level2"
                                        placeholder={t('Hannover, Germany')}
                                    />
                                    <FieldError>{errors.location}</FieldError>
                                </Field>

                                <Field data-invalid={!!errors.website}>
                                    <FieldLabel htmlFor="website">
                                        {t('Website')}
                                    </FieldLabel>
                                    <Input
                                        id="website"
                                        name="website"
                                        type="url"
                                        defaultValue={user.website ?? ''}
                                        autoComplete="url"
                                        placeholder="https://example.com"
                                    />
                                    <FieldError>{errors.website}</FieldError>
                                </Field>
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
                                <FieldError>{errors.bio}</FieldError>
                            </section>

                            <div className="flex items-center gap-4">
                                <Button
                                    type="submit"
                                    disabled={processing || !isDirty}
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
