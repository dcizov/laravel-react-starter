import { Form } from '@inertiajs/react';
import { useRef } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import type { Props as ManagePasskeysProps } from '@/components/manage-passkeys';
import ManagePasskeys from '@/components/manage-passkeys';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import ManageTwoFactor from '@/components/manage-two-factor';
import PasswordInput from '@/components/password-input';
import ContentSection from '@/components/settings/content-section';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { useTrans } from '@/hooks/use-trans';

// oxfmt-ignore
export type SecuritySettingsProps = {
    passwordRules: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

// Password, two-factor, and passkey options. Rendered on the account settings page.
export default function SecuritySettings(props: SecuritySettingsProps) {
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const currentPasswordInputRef = useRef<HTMLInputElement>(null);
    const t = useTrans();

    return (
        <div className="space-y-12">
            <ContentSection
                title={t('Update password')}
                description={t(
                    'Ensure your account is using a long, random password to stay secure',
                )}
            >
                <Form
                    {...SecurityController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) {
                            passwordInputRef.current?.focus();
                        }

                        if (errors.current_password) {
                            currentPasswordInputRef.current?.focus();
                        }
                    }}
                    className="space-y-6"
                >
                    {({ errors, processing, isDirty }) => (
                        <>
                            <Field
                                data-invalid={
                                    !!errors.current_password || undefined
                                }
                            >
                                <FieldLabel htmlFor="current_password">
                                    {t('Current password')}
                                </FieldLabel>

                                <PasswordInput
                                    id="current_password"
                                    ref={currentPasswordInputRef}
                                    name="current_password"
                                    className="mt-1 block w-full"
                                    autoComplete="current-password"
                                    placeholder={t('Current password')}
                                />

                                <FieldError>
                                    {errors.current_password}
                                </FieldError>
                            </Field>

                            <Field
                                data-invalid={!!errors.password || undefined}
                            >
                                <FieldLabel htmlFor="password">
                                    {t('New password')}
                                </FieldLabel>

                                <PasswordInput
                                    id="password"
                                    ref={passwordInputRef}
                                    name="password"
                                    className="mt-1 block w-full"
                                    autoComplete="new-password"
                                    placeholder={t('New password')}
                                    passwordrules={props.passwordRules}
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
                                    name="password_confirmation"
                                    className="mt-1 block w-full"
                                    autoComplete="new-password"
                                    placeholder={t('Confirm password')}
                                    passwordrules={props.passwordRules}
                                />

                                <FieldError>
                                    {errors.password_confirmation}
                                </FieldError>
                            </Field>

                            <div className="flex items-center gap-4">
                                <Button
                                    type="submit"
                                    disabled={processing || !isDirty}
                                    data-test="update-password-button"
                                >
                                    {processing && <Spinner />}
                                    {t('Save')}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </ContentSection>

            <ManageTwoFactor
                canManageTwoFactor={props.canManageTwoFactor}
                requiresConfirmation={props.requiresConfirmation}
                twoFactorEnabled={props.twoFactorEnabled}
            />

            <ManagePasskeys
                canManagePasskeys={props.canManagePasskeys}
                passkeys={props.passkeys}
            />
        </div>
    );
}
