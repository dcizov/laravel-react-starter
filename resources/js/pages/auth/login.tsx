import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const [demoProcessing, setDemoProcessing] = useState(false);
    const form = useForm({ email: '', password: '', remember: false });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/login', { onSuccess: () => form.reset('password') });
    };
    const enterDemo = () => {
        setDemoProcessing(true);
        router.post(
            '/login',
            {
                email: 'demo@structureplan.test',
                password: 'password',
                remember: true,
            },
            { onFinish: () => setDemoProcessing(false) },
        );
    };

    return (
        <>
            <Head title="Log in" />
            <button
                type="button"
                onClick={enterDemo}
                disabled={demoProcessing}
                className="group relative w-full overflow-hidden rounded-2xl border border-[#d7e3d2] bg-[#edf3e8] p-4 text-left transition hover:border-[#bdcfbb] hover:bg-[#e8f0e2] disabled:opacity-60"
            >
                <div className="absolute -top-8 -right-5 size-24 rounded-full border border-[#779174]/10" />
                <div className="relative flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/75 text-[#6d896e] shadow-sm">
                        {demoProcessing ? (
                            <Spinner />
                        ) : (
                            <Sparkles className="size-[18px]" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-semibold text-[#3e5d49]">
                            Explore the demo workspace
                        </div>
                        <div className="mt-1 text-[10px] text-[#7e927e]">
                            One click · Realistic fictional data
                        </div>
                    </div>
                    <ArrowRight className="size-4 text-[#759074] transition group-hover:translate-x-0.5" />
                </div>
            </button>
            <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#e4e8e0]" />
                <span className="text-[9px] font-medium tracking-[0.1em] text-[#9ca69d] uppercase">
                    Or use your account
                </span>
                <div className="h-px flex-1 bg-[#e4e8e0]" />
            </div>
            {status && (
                <div className="mb-5 rounded-xl bg-[#eaf2e6] px-4 py-3 text-xs font-medium text-[#527058]">
                    {status}
                </div>
            )}
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <Label
                        htmlFor="email"
                        className="mb-2 text-xs font-semibold text-[#52665c]"
                    >
                        Email address
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        required
                        autoFocus
                        autoComplete="email"
                        value={form.data.email}
                        onChange={(e) => form.setData('email', e.target.value)}
                        className="h-11 rounded-xl border-[#dfe5dc] bg-white px-3.5 shadow-none focus-visible:border-[#7e9c85] focus-visible:ring-[#7e9c85]/15"
                        placeholder="you@practice.com"
                    />
                    <InputError message={form.errors.email} className="mt-2" />
                </div>
                <div>
                    <div className="mb-2 flex items-center">
                        <Label
                            htmlFor="password"
                            className="text-xs font-semibold text-[#52665c]"
                        >
                            Password
                        </Label>
                        {canResetPassword && (
                            <Link
                                href="/forgot-password"
                                className="ml-auto text-[11px] font-medium text-[#728a75] hover:underline"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>
                    <PasswordInput
                        id="password"
                        required
                        autoComplete="current-password"
                        value={form.data.password}
                        onChange={(e) =>
                            form.setData('password', e.target.value)
                        }
                        className="h-11 rounded-xl border-[#dfe5dc] bg-white px-3.5 shadow-none focus-visible:border-[#7e9c85] focus-visible:ring-[#7e9c85]/15"
                        placeholder="Your password"
                    />
                    <InputError
                        message={form.errors.password}
                        className="mt-2"
                    />
                </div>
                <div className="flex items-center gap-2.5">
                    <Checkbox
                        id="remember"
                        checked={form.data.remember}
                        onCheckedChange={(checked) =>
                            form.setData('remember', checked === true)
                        }
                    />
                    <Label
                        htmlFor="remember"
                        className="text-xs font-normal text-[#7a887e]"
                    >
                        Keep me signed in
                    </Label>
                </div>
                <Button
                    type="submit"
                    disabled={form.processing}
                    className="h-11 w-full rounded-xl bg-[#214d40] text-xs text-white shadow-sm hover:bg-[#193f34]"
                >
                    {form.processing && <Spinner />}Log in to your workspace
                    <ArrowRight />
                </Button>
            </form>
            <p className="mt-6 text-center text-[11px] leading-5 text-[#98a29a]">
                Demo credentials: demo@structureplan.test · password
            </p>
        </>
    );
}

Login.layout = {
    title: 'Welcome back',
    description: 'Sign in to continue to your practice workspace.',
};
