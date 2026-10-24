import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Boxes,
    Check,
    ChevronRight,
    PackagePlus,
    Puzzle,
    RefreshCw,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useBreadcrumbs } from '@/components/breadcrumbs-context';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import type { ContentStatus } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

type AddonStatus = 'active' | 'inactive' | 'discovered' | 'blocked' | 'error';

type AddonCard = {
    handle: string;
    name: string;
    version: string;
    description: string;
    author: string;
    status: AddonStatus;
    installed: boolean;
    can_uninstall: boolean;
    error: string | null;
    permissions: string[];
    navigation: { label?: string; route?: string }[];
    sections: string[];
    resources: string[];
    requires: Record<string, unknown>;
    migrations: boolean;
    activated_at: string | null;
    installed_at: string | null;
    urls: {
        install: string;
        activate: string;
        deactivate: string;
        uninstall: string;
    };
};

type Props = {
    addons: AddonCard[];
    counts: Record<string, number>;
    can: { manage: boolean };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Site', href: '/admin/addons' },
    { title: 'Addons', href: '/admin/addons' },
];

const statusOf: Record<AddonStatus, ContentStatus> = {
    active: 'published',
    inactive: 'draft',
    discovered: 'scheduled',
    blocked: 'error',
    error: 'error',
};

type Payload = Record<string, string | number | boolean | null>;

const labelOf: Record<AddonStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    discovered: 'Not installed',
    blocked: 'Incompatible',
    error: 'Error',
};

export default function AddonsIndex({ addons, counts, can }: Props) {
    const [busy, setBusy] = useState<string | null>(null);
    const [details, setDetails] = useState<AddonCard | null>(null);
    const [uninstall, setUninstall] = useState<AddonCard | null>(null);
    const [confirmation, setConfirmation] = useState('');
    const [deleteData, setDeleteData] = useState(false);
    const [deleteFiles, setDeleteFiles] = useState(false);

    const run = (
        card: AddonCard,
        method: 'post' | 'delete',
        url: string,
        data: Payload = {},
    ) => {
        setBusy(card.handle);

        const options = {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setBusy(null),
            onError: (errors: Record<string, string>) => {
                toast.error('Change reverted', {
                    description:
                        errors.addon ??
                        Object.values(errors)[0] ??
                        'The action was refused.',
                });
            },
        };

        if (method === 'post') {
            router.post(url, data, options);

            return;
        }

        router.delete(url, { ...options, data });
    };

    /**
     * Activation is optimistic like publish: the switch flips immediately and
     * Inertia restores the props when the server refuses (a broken provider, a
     * failed activation rollback, an unmet constraint).
     */
    const toggle = (card: AddonCard) => {
        if (!can.manage || card.status === 'blocked') {
            return;
        }

        const activating = card.status !== 'active';
        const nextStatus: AddonStatus = activating ? 'active' : 'inactive';

        setBusy(card.handle);

        router
            .optimistic((props: Props) => ({
                addons: props.addons.map((row) =>
                    row.handle === card.handle
                        ? { ...row, status: nextStatus }
                        : row,
                ),
                counts: props.counts,
                can: props.can,
            }))
            .post(
                activating ? card.urls.activate : card.urls.deactivate,
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    onFinish: () => setBusy(null),
                    onError: (errors) => {
                        toast.error('Change reverted', {
                            description:
                                errors.addon ??
                                'The addon state was not changed.',
                        });
                    },
                },
            );
    };

    const confirmUninstall = () => {
        if (uninstall === null) {
            return;
        }

        run(uninstall, 'delete', uninstall.urls.uninstall, {
            confirm: confirmation,
            delete_data: deleteData,
            delete_files: deleteFiles,
        });

        setUninstall(null);
        setConfirmation('');
        setDeleteData(false);
        setDeleteFiles(false);
    };

    useBreadcrumbs(breadcrumbs);

    return (
        <>
            <Head title="Addons" />

            <div className="space-y-6">
                <PageHeader
                    title="Addons"
                    description="Addons are folders that register their own routes, navigation, permissions and tables. Nothing is registered until you activate it."
                />

                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                        {counts.all} addons
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span>{counts.active ?? 0} active</span>
                    <span className="text-muted-foreground">·</span>
                    <span>{counts.inactive ?? 0} inactive</span>
                    <span className="text-muted-foreground">·</span>
                    <span>{counts.discovered ?? 0} not installed</span>
                    {counts.blocked ? (
                        <>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-status-error">
                                {counts.blocked} incompatible
                            </span>
                        </>
                    ) : null}
                </div>

                {addons.length === 0 ? (
                    <EmptyState
                        icon={Boxes}
                        title="No addons found"
                        description="Drop an addon folder into app/Addons, then run php artisan lattice:discover."
                    />
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {addons.map((card) => {
                            const isBusy = busy === card.handle;
                            const blocked = card.status === 'blocked';

                            return (
                                <Card
                                    key={card.handle}
                                    className={cn(
                                        'overflow-hidden',
                                        card.status === 'active' &&
                                            'border-primary/40',
                                        blocked && 'border-status-error/30',
                                    )}
                                >
                                    <CardContent className="space-y-3 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <span
                                                    className={cn(
                                                        'flex size-9 shrink-0 items-center justify-center rounded-md',
                                                        card.status === 'active'
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'bg-muted text-muted-foreground',
                                                    )}
                                                >
                                                    <Puzzle className="size-4" />
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h2 className="truncate text-sm font-semibold">
                                                            {card.name}
                                                        </h2>
                                                        <span className="text-[11px] text-muted-foreground">
                                                            v{card.version}
                                                        </span>
                                                    </div>
                                                    <p className="font-mono text-[11px] text-muted-foreground">
                                                        {card.handle}
                                                    </p>
                                                </div>
                                            </div>

                                            <StatusBadge
                                                status={statusOf[card.status]}
                                            />
                                        </div>

                                        <p className="line-clamp-2 text-xs text-muted-foreground">
                                            {card.description}
                                        </p>

                                        {card.error ? (
                                            <p className="flex items-start gap-1.5 rounded border border-status-error/30 bg-status-error-soft px-2 py-1.5 text-[11px] text-status-error">
                                                <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                                                <span className="min-w-0">
                                                    {card.error}
                                                </span>
                                            </p>
                                        ) : null}

                                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                            {card.permissions.length > 0 ? (
                                                <span>
                                                    {card.permissions.length}{' '}
                                                    permissions
                                                </span>
                                            ) : null}
                                            {card.navigation.length > 0 ? (
                                                <span>
                                                    {card.navigation.length} nav
                                                    entries
                                                </span>
                                            ) : null}
                                            {card.sections.length > 0 ? (
                                                <span>
                                                    {card.sections.length}{' '}
                                                    sections
                                                </span>
                                            ) : null}
                                            {card.migrations ? (
                                                <span>own migrations</span>
                                            ) : null}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!card.installed &&
                                            !blocked &&
                                            can.manage ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        run(
                                                            card,
                                                            'post',
                                                            card.urls.install,
                                                        )
                                                    }
                                                    disabled={isBusy}
                                                >
                                                    <PackagePlus className="size-3.5" />
                                                    Install
                                                </Button>
                                            ) : null}

                                            {card.installed && can.manage ? (
                                                <Button
                                                    size="sm"
                                                    variant={
                                                        card.status === 'active'
                                                            ? 'secondary'
                                                            : 'default'
                                                    }
                                                    onClick={() => toggle(card)}
                                                    disabled={isBusy}
                                                >
                                                    {isBusy ? (
                                                        <RefreshCw className="size-3.5 animate-spin" />
                                                    ) : card.status ===
                                                      'active' ? (
                                                        <Check className="size-3.5" />
                                                    ) : null}
                                                    {card.status === 'active'
                                                        ? 'Active'
                                                        : 'Activate'}
                                                </Button>
                                            ) : null}

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setDetails(card)}
                                            >
                                                Details
                                                <ChevronRight className="size-3.5" />
                                            </Button>

                                            {card.can_uninstall &&
                                            can.manage ? (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="ml-auto text-status-error"
                                                    onClick={() =>
                                                        setUninstall(card)
                                                    }
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            ) : null}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <Sheet
                open={details !== null}
                onOpenChange={(open) => (open ? null : setDetails(null))}
            >
                <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                    {details ? (
                        <>
                            <SheetHeader>
                                <SheetTitle>{details.name}</SheetTitle>
                                <SheetDescription>
                                    {details.handle} · v{details.version}
                                    {details.author
                                        ? ` · ${details.author}`
                                        : ''}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="space-y-4 px-4 pb-8 text-sm">
                                <p className="text-xs text-muted-foreground">
                                    {details.description}
                                </p>

                                <Detail
                                    label="Status"
                                    value={labelOf[details.status]}
                                />
                                <Detail
                                    label="Installed"
                                    value={
                                        details.installed_at
                                            ? new Date(
                                                  details.installed_at,
                                              ).toLocaleString()
                                            : '—'
                                    }
                                />
                                <Detail
                                    label="Activated"
                                    value={
                                        details.activated_at
                                            ? new Date(
                                                  details.activated_at,
                                              ).toLocaleString()
                                            : '—'
                                    }
                                />

                                {Object.keys(details.requires).length > 0 ? (
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold">
                                            Requires
                                        </p>
                                        <ul className="space-y-0.5 text-xs text-muted-foreground">
                                            {Object.entries(
                                                details.requires,
                                            ).map(([key, value]) => (
                                                <li
                                                    key={key}
                                                    className="font-mono"
                                                >
                                                    {key}:{' '}
                                                    {Array.isArray(value)
                                                        ? value.join(', ')
                                                        : String(value)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}

                                {[
                                    ['Permissions', details.permissions],
                                    [
                                        'Navigation',
                                        details.navigation.map((item) =>
                                            `${item.label ?? ''} ${item.route ?? ''}`.trim(),
                                        ),
                                    ],
                                    ['Sections', details.sections],
                                    ['Resources', details.resources],
                                ].map(([label, values]) =>
                                    Array.isArray(values) &&
                                    values.length > 0 ? (
                                        <div
                                            key={label as string}
                                            className="space-y-1"
                                        >
                                            <p className="text-xs font-semibold">
                                                {label as string}
                                            </p>
                                            <ul className="space-y-0.5 text-xs text-muted-foreground">
                                                {(values as string[]).map(
                                                    (value) => (
                                                        <li
                                                            key={value}
                                                            className="font-mono"
                                                        >
                                                            {value}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    ) : null,
                                )}
                            </div>
                        </>
                    ) : null}
                </SheetContent>
            </Sheet>

            <Dialog
                open={uninstall !== null}
                onOpenChange={(open) => (open ? null : setUninstall(null))}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Uninstall “{uninstall?.name}”?
                        </DialogTitle>
                        <DialogDescription>
                            Its navigation, routes and permissions disappear
                            immediately. Choose what happens to the data it
                            created.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="confirm-handle" className="text-xs">
                                Type{' '}
                                <span className="font-mono font-semibold">
                                    {uninstall?.handle}
                                </span>{' '}
                                to confirm
                            </Label>
                            <Input
                                id="confirm-handle"
                                value={confirmation}
                                onChange={(event) =>
                                    setConfirmation(event.target.value)
                                }
                                autoComplete="off"
                                className="font-mono"
                            />
                        </div>

                        <label className="flex items-start gap-2 text-xs">
                            <Checkbox
                                checked={deleteData}
                                onCheckedChange={(checked) =>
                                    setDeleteData(checked === true)
                                }
                            />
                            <span>
                                Roll back its migrations and drop its tables
                                <span className="block text-muted-foreground">
                                    Off keeps the data so a reinstall picks up
                                    where it left off.
                                </span>
                            </span>
                        </label>

                        <label className="flex items-start gap-2 text-xs">
                            <Checkbox
                                checked={deleteFiles}
                                onCheckedChange={(checked) =>
                                    setDeleteFiles(checked === true)
                                }
                            />
                            <span>
                                Delete its folder from app/Addons
                                <span className="block text-muted-foreground">
                                    Core files are never touched.
                                </span>
                            </span>
                        </label>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setUninstall(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={confirmation !== uninstall?.handle}
                            onClick={confirmUninstall}
                        >
                            Uninstall
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium">{value}</span>
        </div>
    );
}
