import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Lattice" />
            <div className="relative flex min-h-screen flex-col bg-background text-foreground">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_50%_-20%,--theme(--color-primary/12),transparent)]"
                />

                <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <AppLogoIcon className="size-5" />
                        </div>
                        <span className="text-sm font-semibold tracking-tight">
                            Lattice
                        </span>
                    </div>

                    <nav className="flex items-center gap-2">
                        {auth.user ? (
                            <Button asChild size="sm">
                                <Link href="/admin">
                                    Open admin
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild size="sm">
                                <Link href="/login">Sign in</Link>
                            </Button>
                        )}
                    </nav>
                </header>

                <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
                    <p className="mb-4 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                        Self-hosted CMS
                    </p>
                    <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                        Content, structure and addons — under one roof.
                    </h1>
                    <p className="mt-5 max-w-xl text-base text-balance text-muted-foreground">
                        Lattice gives content teams pages with revisions, a
                        media library and a themeable public site. Features ship
                        as addons you switch on from the dashboard.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Button asChild size="lg">
                            <Link href={auth.user ? '/admin' : '/login'}>
                                {auth.user ? 'Go to dashboard' : 'Sign in'}
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    </div>
                    <p className="mt-6 text-xs text-muted-foreground">
                        Invite-only. Accounts are created by an administrator.
                    </p>
                </main>

                <footer className="relative z-10 mx-auto w-full max-w-6xl border-t border-border/60 px-6 py-5 text-xs text-muted-foreground">
                    Lattice · self-hosted content platform
                </footer>
            </div>
        </>
    );
}
