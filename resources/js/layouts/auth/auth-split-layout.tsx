import { Link } from '@inertiajs/react';
import { Layers, ShieldCheck, Sparkles } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { AuthLayoutProps } from '@/types';

const highlights = [
    {
        icon: Layers,
        title: 'Structured content',
        description: 'Pages, revisions and a media library in one place.',
    },
    {
        icon: Sparkles,
        title: 'Addons on demand',
        description: 'Turn features on from the dashboard — no deploys.',
    },
    {
        icon: ShieldCheck,
        title: 'Role-aware',
        description: 'Admins, editors and authors each see what they need.',
    },
];

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative grid min-h-dvh lg:grid-cols-2">
            <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-[oklch(0.38_0.16_280)] to-[oklch(0.24_0.09_290)] p-10 text-white lg:flex">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl"
                />
                <Link
                    href="/"
                    className="relative z-10 flex items-center gap-2.5 text-lg font-semibold tracking-tight"
                >
                    <span className="flex size-9 items-center justify-center rounded-md bg-white/15 ring-1 ring-white/25">
                        <AppLogoIcon className="size-5" />
                    </span>
                    Lattice
                </Link>

                <div className="relative z-10 max-w-sm space-y-8">
                    <p className="text-2xl leading-snug font-medium text-balance">
                        The content platform your team actually maintains.
                    </p>
                    <ul className="space-y-5">
                        {highlights.map((item) => (
                            <li key={item.title} className="flex gap-3">
                                <item.icon className="mt-0.5 size-4.5 shrink-0 text-white/80" />
                                <div>
                                    <p className="text-sm font-medium">
                                        {item.title}
                                    </p>
                                    <p className="text-sm text-white/70">
                                        {item.description}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative z-10 text-xs text-white/60">
                    Invite-only · Self-hosted · Your data stays yours
                </p>
            </aside>

            <div className="flex flex-col items-center justify-center px-6 py-12 sm:px-8">
                <div className="w-full max-w-sm space-y-6">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 text-base font-semibold tracking-tight lg:hidden"
                    >
                        <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <AppLogoIcon className="size-5" />
                        </span>
                        Lattice
                    </Link>

                    <div className="space-y-2 text-left sm:text-center">
                        <h1 className="text-xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        {description ? (
                            <p className="text-sm text-balance text-muted-foreground">
                                {description}
                            </p>
                        ) : null}
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
