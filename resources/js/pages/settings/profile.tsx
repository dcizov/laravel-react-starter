import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors, isDirty }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                    aria-invalid={!!errors.name}
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="email"
                                    placeholder="Email address"
                                    aria-invalid={!!errors.email}
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div
                                        role="status"
                                        aria-live="polite"
                                        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-200/20 dark:bg-amber-900/20 dark:text-amber-100"
                                    >
                                        <p className="font-medium">
                                            Your email address is unverified.
                                        </p>
                                        <p className="mt-1 text-amber-800 dark:text-amber-200">
                                            Changing your email address requires
                                            verification again.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="font-medium underline underline-offset-4 transition-colors hover:text-amber-950 dark:hover:text-amber-50"
                                            >
                                                Resend verification email
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <p className="mt-2 font-medium text-green-700 dark:text-green-400">
                                                A new verification link has been
                                                sent to your email address.
                                            </p>
                                        )}
                                    </div>
                                )}

                            {isDirty && (
                                <p
                                    role="status"
                                    className="text-sm text-muted-foreground"
                                >
                                    You have unsaved changes.
                                </p>
                            )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                    aria-busy={processing}
                                >
                                    {processing ? 'Saving…' : 'Save'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

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
