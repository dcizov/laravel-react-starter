import { Form, Head } from '@inertiajs/react';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTrans } from '@/hooks/use-trans';
import { store } from '@/routes/register';
import { login } from '@/routes';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    const t = useTrans();
    return (
        <>
            <Head title={t('Register')} />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('Name')}</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder={t('Full name')}
                                />
                                <FieldError className="mt-2">
                                    {errors.name}
                                </FieldError>
                            </div>

                            <Field data-invalid={!!errors.email || undefined}>
                                <FieldLabel htmlFor="email">
                                    {t('Email address')}
                                </FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <FieldError>{errors.email}</FieldError>
                            </Field>

                            <Field
                                data-invalid={!!errors.password || undefined}
                            >
                                <FieldLabel htmlFor="password">
                                    {t('Password')}
                                </FieldLabel>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder={t('Password')}
                                    passwordrules={passwordRules}
                                />
                                <FieldError>{errors.password}</FieldError>
                            </Field>

                            <Field
                                data-invalid={
                                    !!errors.password_confirmation || undefined
                                }
                            >
                                <FieldLabel htmlFor="password_confirmation">
                                    {t('Confirm password')}
                                </FieldLabel>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder={t('Confirm password')}
                                    passwordrules={passwordRules}
                                />
                                <FieldError>
                                    {errors.password_confirmation}
                                </FieldError>
                            </Field>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                {t('Create account')}
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            {t('Already have an account?')}{' '}
                            <TextLink href={login()} tabIndex={6}>
                                {t('Log in')}
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
