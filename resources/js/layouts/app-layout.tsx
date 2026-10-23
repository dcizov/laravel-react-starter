import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    CalendarDays,
    ChevronDown,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    Menu,
    Plus,
    Search,
    Settings,
    ShieldCheck,
    UsersRound,
    X,
} from 'lucide-react';
import {
    useEffect,
    useRef,
    useState,
    type FormEvent,
    type ReactNode,
} from 'react';
import { PatientAvatar } from '@/components/patient-avatar';
import { StructureLogo } from '@/components/structure-logo';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

const navigation = [
    { title: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Patients', href: '/patients', icon: UsersRound },
    { title: 'Treatment plans', href: '/plans', icon: ClipboardList },
    { title: 'Sessions', href: '/sessions', icon: CalendarDays },
    { title: 'Check-ins', href: '/check-ins', icon: Activity },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const { url, props } = usePage();
    const user = props.auth.user;

    return (
        <div className="flex h-full flex-col bg-[#173f35] text-white">
            <div className="flex h-[82px] items-center px-6">
                <Link
                    href="/dashboard"
                    onClick={onNavigate}
                    aria-label="StructurePlan dashboard"
                >
                    <StructureLogo light />
                </Link>
            </div>
            <div className="px-4 pt-5">
                <div className="mb-3 px-3 text-[9px] font-semibold tracking-[0.18em] text-white/35 uppercase">
                    Your workspace
                </div>
                <nav className="space-y-1.5" aria-label="Main navigation">
                    {navigation.map((item) => {
                        const active =
                            item.href === '/dashboard'
                                ? url === '/dashboard'
                                : url.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    'group relative flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-all',
                                    active
                                        ? 'bg-white/[0.11] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.035)]'
                                        : 'text-white/58 hover:bg-white/[0.06] hover:text-white/90',
                                )}
                            >
                                {active && (
                                    <span className="absolute top-3 -left-4 h-5 w-[3px] rounded-r-full bg-[#bed6ae]" />
                                )}
                                <item.icon
                                    className={cn(
                                        'size-[18px]',
                                        active
                                            ? 'text-[#c9ddb9]'
                                            : 'text-white/45 group-hover:text-white/75',
                                    )}
                                    strokeWidth={1.8}
                                />
                                {item.title}
                                {item.title === 'Sessions' && (
                                    <span className="ml-auto rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[9px] text-white/45">
                                        Today
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="mx-5 mt-8 border-t border-white/[0.07]" />
            <div className="px-4 pt-5">
                <Link
                    href="/settings/profile"
                    onClick={onNavigate}
                    className={cn(
                        'flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition',
                        url.startsWith('/settings')
                            ? 'bg-white/[0.11] text-white'
                            : 'text-white/55 hover:bg-white/[0.06] hover:text-white',
                    )}
                >
                    <Settings
                        className="size-[18px] text-white/45"
                        strokeWidth={1.8}
                    />
                    Settings
                </Link>
            </div>
            <div className="mt-auto px-5 pb-5">
                <div className="relative mb-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4">
                    <div className="absolute -top-8 -right-7 size-24 rounded-full border border-white/[0.06]" />
                    <div className="absolute -top-4 -right-3 size-16 rounded-full border border-white/[0.06]" />
                    <div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-[#cfe0c2]/10 text-[#cfe0c2]">
                        <ShieldCheck className="size-4" />
                    </div>
                    <p className="text-xs font-medium text-white/85">
                        Small steps. Real progress.
                    </p>
                    <p className="mt-1.5 text-[10px] leading-4 text-white/38">
                        A calm space for thoughtful, person-centered care.
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.06]">
                            <PatientAvatar
                                initials={
                                    user?.name
                                        ?.split(' ')
                                        .filter((part) => part.length > 1)
                                        .map((part) => part[0])
                                        .join('')
                                        .slice(-2)
                                        .toUpperCase() || 'MC'
                                }
                                id={3}
                                className="size-9 bg-[#dbe7d3] text-[#315444]"
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-medium text-white/90">
                                    {user?.name}
                                </span>
                                <span className="mt-0.5 block truncate text-[10px] text-white/38">
                                    Psychotherapist
                                </span>
                            </span>
                            <ChevronDown className="size-3.5 text-white/35" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="top"
                        align="start"
                        className="w-56 rounded-xl border-[#e2e6df] bg-white p-1.5"
                    >
                        <DropdownMenuLabel>
                            <span className="block text-xs text-[#263f36]">
                                {user?.name}
                            </span>
                            <span className="mt-0.5 block text-[10px] font-normal text-[#849087]">
                                {user?.email}
                            </span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link
                                href="/settings/profile"
                                className="cursor-pointer"
                            >
                                <Settings /> Account settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="w-full cursor-pointer"
                            >
                                <LogOut /> Log out
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

export default function AppLayout({
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [navigating, setNavigating] = useState(false);
    const [search, setSearch] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const start = router.on('start', () => setNavigating(true));
        const finish = router.on('finish', () => setNavigating(false));
        return () => {
            start();
            finish();
        };
    }, []);

    useEffect(() => {
        const listener = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', listener);
        return () => window.removeEventListener('keydown', listener);
    }, []);

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        if (search.trim()) router.get('/patients', { search: search.trim() });
    };

    return (
        <div className="min-h-screen bg-[#f6f7f4] text-[#263f36]">
            {navigating && (
                <div className="fixed top-0 right-0 left-0 z-[100] h-0.5 overflow-hidden bg-[#cfe0c5]/30">
                    <div className="h-full w-1/3 animate-[loading_1s_ease-in-out_infinite] bg-[#719077]" />
                </div>
            )}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-[244px] lg:block">
                <SidebarContent />
            </aside>
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        className="absolute inset-0 bg-[#102c25]/45 backdrop-blur-[2px]"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Close navigation"
                    />
                    <aside className="relative h-full w-[276px] shadow-2xl">
                        <SidebarContent
                            onNavigate={() => setMobileOpen(false)}
                        />
                    </aside>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="absolute top-5 left-[288px] rounded-full bg-white/10 p-2 text-white"
                        aria-label="Close menu"
                    >
                        <X className="size-5" />
                    </button>
                </div>
            )}
            <div className="lg:pl-[244px]">
                <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-[#e5e8e1] bg-[#fbfcfa]/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
                    <button
                        className="mr-3 rounded-lg p-2 text-[#597066] hover:bg-[#edf1ea] lg:hidden"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open navigation"
                    >
                        <Menu className="size-5" />
                    </button>
                    <div className="mr-4 lg:hidden">
                        <StructureLogo compact />
                    </div>
                    <form
                        onSubmit={submitSearch}
                        className="relative hidden w-full max-w-[340px] md:block"
                    >
                        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#98a299]" />
                        <Input
                            ref={searchRef}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="h-9 rounded-xl border-transparent bg-[#f0f2ed] pr-14 pl-10 text-xs shadow-none placeholder:text-[#939e96] focus-visible:border-[#d8e0d4] focus-visible:ring-[#7c9680]/10"
                            placeholder="Find a patient…"
                            aria-label="Find a patient"
                        />
                        <kbd className="absolute top-1/2 right-3 -translate-y-1/2 rounded border border-[#dce1d8] bg-white px-1.5 py-0.5 text-[9px] text-[#9aa39c]">
                            ⌘ K
                        </kbd>
                    </form>
                    <div className="ml-auto flex items-center gap-3">
                        <div className="hidden text-right xl:block">
                            <div className="text-[11px] font-medium text-[#66766c]">
                                {new Intl.DateTimeFormat('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                }).format(new Date())}
                            </div>
                            <div className="mt-0.5 text-[9px] tracking-wide text-[#9aa39b] uppercase">
                                Your practice at a glance
                            </div>
                        </div>
                        <div className="hidden h-7 w-px bg-[#e3e7df] sm:block" />
                        <Button
                            asChild
                            className="h-9 rounded-xl bg-[#214d40] px-3.5 text-xs text-white shadow-sm hover:bg-[#193f34]"
                        >
                            <Link href="/sessions?create=1">
                                <Plus className="size-4" />{' '}
                                <span className="hidden sm:inline">
                                    New session
                                </span>
                                <span className="sm:hidden">Session</span>
                            </Link>
                        </Button>
                    </div>
                </header>
                <main className="mx-auto w-full max-w-[1540px] p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
                <footer className="mx-auto flex max-w-[1540px] flex-col gap-1 px-6 pt-2 pb-8 text-[10px] text-[#9aa39b] sm:flex-row sm:items-center sm:justify-between lg:px-8">
                    <span>
                        StructurePlan · Thoughtful care, gently organized.
                    </span>
                    <span>
                        Demo information is fictional · Not for emergency use
                    </span>
                </footer>
            </div>
        </div>
    );
}
