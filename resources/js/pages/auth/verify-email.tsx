// Components
import { Form, Head } from '@inertiajs/react';
import { StatusAlert } from '@/components/status-alert';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useTrans } from '@/hooks/use-trans';
import { send } from '@/routes/verification';
import { logout } from '@/routes';

export default function VerifyEmail({ status }: { status?: string }) {
    const t = useTrans();
    return (
        <>
            <Head title={t('Email verification')} />

            {status === 'verification-link-sent' && (
                <StatusAlert className="mb-4">
                    {t(
                        'A new verification link has been sent to the email address you provided during registration.',
                    )}
                </StatusAlert>
            )}

            <Form {...send.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button
                            type="submit"
                            disabled={processing}
                            variant="secondary"
                        >
                            {processing && <Spinner />}
                            {t('Resend verification email')}
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm"
                        >
                            {t('Log out')}
                        </TextLink>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Email verification',
    description:
        'Please verify your email address by clicking on the link we just emailed to you.',
};
