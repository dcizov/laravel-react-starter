import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Check, Palette, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useBreadcrumbs } from '@/components/breadcrumbs-context';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

type Tokens = {
    accent?: string;
    radius?: string;
    font?: string;
    heading_font?: string;
    heading_weight?: string;
    density?: string;
};

type ThemeRow = {
    handle: string;
    name: string;
    version: string;
    description: string;
    screenshot_url: string | null;
    tokens: Tokens;
    is_active: boolean;
    state: 'active' | 'inactive' | 'discovered' | 'error';
    error: string | null;
    installed: boolean;
    urls: { activate: string };
};

type Props = {
    themes: ThemeRow[];
    active: {
        handle: string;
        name: string;
        tokens: Tokens;
        degraded: boolean;
    } | null;
    can: { activate: boolean };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Site', href: '/admin/appearance' },
    { title: 'Appearance', href: '/admin/appearance' },
];

export default function AppearanceIndex({ themes, active, can }: Props) {
    const [pending, setPending] = useState<string | null>(null);

    /**
     * Optimistic activation: the cards flip immediately, Inertia rolls the
     * props back if the server refuses (e.g. an unmet version constraint).
     */
    const activate = (theme: ThemeRow) => {
        if (theme.is_active || !can.activate) {
            return;
        }

        setPending(theme.handle);

        router
            .optimistic((props: Props) => ({
                themes: props.themes.map((row) => ({
                    ...row,
                    is_active: row.handle === theme.handle,
                    state:
                        row.handle === theme.handle
                            ? ('active' as const)
                            : row.is_active
                              ? ('inactive' as const)
                              : row.state,
                })),
                active: {
                    handle: theme.handle,
                    name: theme.name,
                    tokens: theme.tokens,
                    degraded: false,
                },
                can: props.can,
            }))
            .post(
                theme.urls.activate,
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    onFinish: () => setPending(null),
                    onError: (errors) => {
                        toast.error('Change reverted', {
                            description:
                                errors.theme ??
                                'The theme could not be activated.',
                        });
                    },
                },
            );
    };

    useBreadcrumbs(breadcrumbs);

    return (
        <>
            <Head title="Appearance" />

            <div className="space-y-6">
                <PageHeader
                    title="Appearance"
                    description="Themes are folders with a manifest. Switching one changes the public site immediately — no rebuild."
                />

                <Card>
                    <CardContent className="flex flex-wrap items-center gap-3 py-4">
                        <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Palette className="size-4" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-medium">
                                Active theme: {active?.name ?? 'none'}
                                {active?.degraded ? (
                                    <span className="ml-2 text-xs text-status-scheduled">
                                        running in fallback
                                    </span>
                                ) : null}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {active
                                    ? `Accent ${active.tokens.accent ?? '—'} · radius ${active.tokens.radius ?? '—'} · ${active.tokens.heading_font ?? 'Inter'} headings`
                                    : 'No theme is active. Public pages fall back to the core renderer.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {themes.length === 0 ? (
                    <EmptyState
                        icon={Palette}
                        title="No themes found"
                        description="Drop a theme folder into app/Themes and run php artisan lattice:discover."
                    />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {themes.map((theme) => {
                            const busy = pending === theme.handle;

                            return (
                                <Card
                                    key={theme.handle}
                                    className={cn(
                                        'overflow-hidden py-0 transition-shadow',
                                        theme.is_active
                                            ? 'border-primary/50 ring-1 ring-primary/20'
                                            : 'hover:shadow-md',
                                    )}
                                >
                                    <div
                                        className="relative flex h-32 items-end justify-between p-3"
                                        style={{
                                            background: `linear-gradient(135deg, color-mix(in oklch, ${theme.tokens.accent ?? 'oklch(0.51 0.19 264)'} 22%, white) 0%, color-mix(in oklch, ${theme.tokens.accent ?? 'oklch(0.51 0.19 264)'} 8%, white) 100%)`,
                                        }}
                                    >
                                        {theme.screenshot_url ? (
                                            <img
                                                src={theme.screenshot_url}
                                                alt={`${theme.name} preview`}
                                                className="absolute inset-0 size-full object-cover"
                                            />
                                        ) : (
                                            <div className="space-y-1.5">
                                                <div
                                                    className="h-2.5 w-24 rounded-full"
                                                    style={{
                                                        background:
                                                            theme.tokens.accent,
                                                    }}
                                                />
                                                <div className="h-1.5 w-16 rounded-full bg-foreground/20" />
                                                <div className="h-1.5 w-20 rounded-full bg-foreground/10" />
                                            </div>
                                        )}
                                        <div className="relative ml-auto flex items-center gap-1.5">
                                            {theme.state === 'error' ? (
                                                <StatusBadge status="error" />
                                            ) : theme.is_active ? (
                                                <StatusBadge status="published" />
                                            ) : (
                                                <StatusBadge status="draft" />
                                            )}
                                        </div>
                                    </div>

                                    <CardContent className="space-y-3 p-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-sm font-semibold">
                                                    {theme.name}
                                                </h2>
                                                <span className="text-[11px] text-muted-foreground">
                                                    v{theme.version}
                                                </span>
                                            </div>
                                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                {theme.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 text-[11px]">
                                            <span
                                                className="size-3 rounded-full border border-border"
                                                style={{
                                                    background:
                                                        theme.tokens.accent,
                                                }}
                                                aria-hidden="true"
                                            />
                                            <span className="font-mono text-muted-foreground">
                                                {theme.tokens.radius}
                                            </span>
                                            <span className="ml-auto text-muted-foreground">
                                                {theme.tokens.heading_font}
                                            </span>
                                        </div>

                                        {theme.error ? (
                                            <p className="flex items-start gap-1.5 rounded border border-status-error/30 bg-status-error-soft px-2 py-1.5 text-[11px] text-status-error">
                                                <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                                                {theme.error}
                                            </p>
                                        ) : null}

                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant={
                                                    theme.is_active
                                                        ? 'secondary'
                                                        : 'default'
                                                }
                                                disabled={
                                                    theme.is_active ||
                                                    !can.activate ||
                                                    busy
                                                }
                                                onClick={() => activate(theme)}
                                                className="flex-1"
                                            >
                                                {busy ? (
                                                    <>
                                                        <RotateCcw className="size-3.5 animate-spin" />
                                                        Activating…
                                                    </>
                                                ) : theme.is_active ? (
                                                    <>
                                                        <Check className="size-3.5" />
                                                        Active
                                                    </>
                                                ) : (
                                                    'Activate'
                                                )}
                                            </Button>
                                            {!theme.installed ? (
                                                <span className="text-[11px] text-muted-foreground">
                                                    on disk
                                                </span>
                                            ) : null}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
