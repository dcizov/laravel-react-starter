import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useTrans } from '@/hooks/use-trans';
import { store } from '@/routes/newsletter';

// The public sign-up form. It gives the same answer whether or not the address is already on the list.
export default function NewsletterSubscribe() {
    const t = useTrans();

    return (
        <>
            <Head title={t('Newsletter')} />

            <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 p-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('Subscribe to the newsletter')}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t(
                            'Get news and updates by email. You can unsubscribe at any time.',
                        )}
                    </p>
                </div>

                <Form
                    {...store.form()}
                    resetOnSuccess={['email']}
                    options={{ preserveScroll: true }}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <Field data-invalid={!!errors.email || undefined}>
                                <FieldLabel htmlFor="email">
                                    {t('Email address')}
                                </FieldLabel>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    required
                                    aria-invalid={!!errors.email || undefined}
                                />
                                <FieldError>{errors.email}</FieldError>
                            </Field>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                {t('Subscribe')}
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
