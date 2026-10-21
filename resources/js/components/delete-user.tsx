import { Form } from '@inertiajs/react';
import { TriangleAlertIcon } from 'lucide-react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import PasswordInput from '@/components/password-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { useTrans } from '@/hooks/use-trans';

export default function DeleteUser() {
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const t = useTrans();

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title={t('Delete account')}
                description={t('Delete your account and all of its resources')}
            />
            <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>{t('Warning')}</AlertTitle>
                <AlertDescription>
                    {t('Please proceed with caution, this cannot be undone.')}
                </AlertDescription>
            </Alert>

            <Dialog>
                <DialogTrigger
                    render={
                        <Button
                            variant="destructive"
                            data-test="delete-user-button"
                        />
                    }
                >
                    {t('Delete account')}
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>
                        {t('Are you sure you want to delete your account?')}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            'Once your account is deleted, all of its resources and data will also be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.',
                        )}
                    </DialogDescription>

                    <Form
                        {...ProfileController.destroy.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        onError={() => passwordInputRef.current?.focus()}
                        resetOnSuccess
                        className="space-y-6"
                    >
                        {({ resetAndClearErrors, processing, errors }) => (
                            <>
                                <Field data-invalid={!!errors.password || undefined}>
                                    <FieldLabel
                                        htmlFor="password"
                                        className="sr-only"
                                    >
                                        {t('Password')}
                                    </FieldLabel>

                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        ref={passwordInputRef}
                                        placeholder={t('Password')}
                                        autoComplete="current-password"
                                    />

                                    <FieldError>{errors.password}</FieldError>
                                </Field>

                                <DialogFooter className="gap-2">
                                    <DialogClose
                                        render={
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() =>
                                                    resetAndClearErrors()
                                                }
                                            />
                                        }
                                    >
                                        {t('Cancel')}
                                    </DialogClose>

                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={processing}
                                        data-test="confirm-delete-user-button"
                                    >
                                        {processing && <Spinner />}
                                        {t('Delete account')}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
