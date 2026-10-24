import { Form, Head, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    token: string;
    email: string;
    role: string;
    passwordRules: string;
};

export default function AcceptInvitation({
    token,
    email,
    role,
    passwordRules,
}: Props) {
    const { name } = usePage().props;

    return (
        <>
            <Head title="Accept invitation" />

            <Form
                action={`/invitations/${token}`}
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                            <p>
                                <span className="text-muted-foreground">
                                    Joining as{' '}
                                </span>
                                <span className="font-medium">{role}</span>
                            </p>
                            <p>
                                <span className="text-muted-foreground">
                                    Email{' '}
                                </span>
                                <span className="font-medium">{email}</span>
                            </p>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Your name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    autoFocus
                                    placeholder="Full name"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    passwordrules={passwordRules}
                                    placeholder="Choose a password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    required
                                    placeholder="Repeat the password"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing ? <Spinner /> : null}
                            Accept invitation to {name}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}
