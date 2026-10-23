import { Link } from '@inertiajs/react';
import {
    Activity,
    CalendarDays,
    ClipboardList,
    ShieldCheck,
} from 'lucide-react';
import { StructureLogo } from '@/components/structure-logo';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="grid min-h-svh bg-[#fbfcfa] lg:grid-cols-[minmax(400px,.9fr)_1.1fr]">
            <section className="relative hidden overflow-hidden bg-[#173f35] p-12 text-white lg:flex lg:flex-col xl:p-16">
                <div className="absolute -top-40 -right-40 size-[420px] rounded-full border border-white/[0.055]" />
                <div className="absolute -top-24 -right-24 size-[280px] rounded-full border border-white/[0.055]" />
                <div className="absolute -bottom-56 -left-32 size-[480px] rounded-full border border-white/[0.045]" />
                <Link href="/" className="relative w-fit">
                    <StructureLogo light />
                </Link>
                <div className="relative my-auto max-w-[480px] py-16">
                    <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-[10px] font-medium tracking-wide text-[#d1e0c9]">
                        <span className="size-1.5 rounded-full bg-[#d6a489]" />{' '}
                        Built for thoughtful, person-centered care
                    </div>
                    <h1 className="text-[42px] leading-[1.12] font-medium tracking-[-0.045em] text-white xl:text-[50px]">
                        Structure for the work.
                        <br />
                        <span className="text-[#bfd2b3]">
                            Space for the person.
                        </span>
                    </h1>
                    <p className="mt-6 max-w-md text-[15px] leading-7 text-white/50">
                        A calmer way to support people navigating ADHD and
                        depression—one connected plan, conversation, and small
                        step at a time.
                    </p>
                    <div className="mt-10 grid gap-4">
                        {[
                            [
                                ClipboardList,
                                'Collaborative treatment plans',
                                'Goals and interventions that stay flexible',
                            ],
                            [
                                CalendarDays,
                                'Connected session notes',
                                'Every conversation in one ongoing story',
                            ],
                            [
                                Activity,
                                'Everyday wellbeing context',
                                'Notice patterns without reducing people to scores',
                            ],
                        ].map(([Icon, heading, copy]) => {
                            const FeatureIcon = Icon as typeof ClipboardList;
                            return (
                                <div
                                    key={heading as string}
                                    className="flex items-center gap-4"
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.05] text-[#c5d8b9]">
                                        <FeatureIcon
                                            className="size-[18px]"
                                            strokeWidth={1.7}
                                        />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-white/80">
                                            {heading as string}
                                        </div>
                                        <div className="mt-1 text-[10px] text-white/35">
                                            {copy as string}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="relative flex items-center gap-2 text-[10px] text-white/35">
                    <ShieldCheck className="size-3.5" /> Private workspace ·
                    Fictional demo data · Not for emergency use
                </div>
            </section>
            <main className="relative flex min-h-svh flex-col px-5 py-6 sm:px-10 lg:px-16">
                <div className="flex items-center justify-between lg:justify-end">
                    <Link href="/" className="lg:hidden">
                        <StructureLogo />
                    </Link>
                    <div className="text-xs text-[#8b978e]">
                        New to StructurePlan?{' '}
                        <Link
                            href="/register"
                            className="ml-1 font-semibold text-[#47634f] hover:underline"
                        >
                            Create account
                        </Link>
                    </div>
                </div>
                <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
                    <div className="mb-8">
                        <div className="mb-3 text-[10px] font-semibold tracking-[0.15em] text-[#8d9a90] uppercase">
                            Your practice, gently organized
                        </div>
                        <h2 className="text-[30px] font-semibold tracking-[-0.04em] text-[#27463a]">
                            {title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#829087]">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
                <div className="text-center text-[10px] text-[#a0aaa2]">
                    © {new Date().getFullYear()} StructurePlan · Care with
                    clarity
                </div>
            </main>
        </div>
    );
}
