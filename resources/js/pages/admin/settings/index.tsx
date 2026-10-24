import { Head, Link, router, useForm } from '@inertiajs/react';
import { ImagePlus, RotateCcw, Save, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { MediaPicker } from '@/components/media/media-picker';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

type FieldOption = { value: string; label: string };

type SettingsField = {
    key: string;
    label: string;
    type: 'string' | 'text' | 'integer' | 'boolean' | 'select' | 'email' | 'secret' | 'media' | 'color';
    hint: string | null;
    required: boolean;
    options: FieldOption[];
    value: unknown;
    has_value: boolean | null;
    preview: string | null;
};

type GroupLink = { key: string; label: string; icon: string; url: string };

type Props = {
    groups: GroupLink[];
    group: { key: string; label: string; description: string; fields: SettingsField[]; url: string };
    can: { update: boolean };
};

type FormValue = string | number | null;

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/admin/settings' },
];

/**
 * Every field on this screen comes from the server schema. Adding a setting is
 * a PHP change; nothing here knows what a "site name" or a "mail host" is.
 */
export default function Settings({ groups, group, can }: Props) {
    // Booleans are not part of the form: each one saves on its own.
    const editable = group.fields.filter((field) => field.type !== 'boolean');

    const form = useForm<Record<string, FormValue>>(
        Object.fromEntries(editable.map((field) => [field.key, initial(field)])),
    );

    const [previews, setPreviews] = useState<Record<string, string | null>>(
        Object.fromEntries(group.fields.filter((field) => field.type === 'media').map((field) => [field.key, field.preview])),
    );
    const [picking, setPicking] = useState<string | null>(null);

    const save = () => {
        form.patch(group.url, {
            preserveScroll: true,
            onSuccess: () => toast.success('Settings saved'),
            onError: (errors) => toast.error('Could not save', { description: Object.values(errors)[0] }),
        });
    };

    return (
        <AppLayout breadcrumbs={[...breadcrumbs, { title: group.label, href: group.url }]}>
            <Head title={`${group.label} settings`} />

            <div className="space-y-5 pb-24">
                <PageHeader
                    title="Settings"
                    description="Site-wide values. Changes here reach the public site on the next request."
                />

                <nav className="flex flex-wrap gap-1" aria-label="Settings groups">
                    {groups.map((item) => (
                        <Link
                            key={item.key}
                            href={item.url}
                            className={cn(
                                'rounded-md px-3 py-1.5 text-sm transition-colors',
                                item.key === group.key
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                            aria-current={item.key === group.key ? 'page' : undefined}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{group.label}</CardTitle>
                        <p className="text-muted-foreground text-xs">{group.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {group.fields.map((field) => (
                            <div key={field.key} className="grid gap-2 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:items-start">
                                <div className="space-y-0.5">
                                    <Label htmlFor={`settings-${field.key}`}>
                                        {field.label}
                                        {field.required ? <span className="text-status-error"> *</span> : null}
                                    </Label>
                                    {field.hint ? <p className="text-muted-foreground text-[11px]">{field.hint}</p> : null}
                                </div>

                                <div className="space-y-1">
                                    {field.type === 'boolean' ? (
                                        <Switch
                                            id={`settings-${field.key}`}
                                            checked={Boolean(field.value)}
                                            disabled={!can.update}
                                            label={field.label}
                                            onChange={(next) => toggleBoolean(field, next, group.url)}
                                        />
                                    ) : field.type === 'media' ? (
                                        <div className="flex items-center gap-2">
                                            {previews[field.key] ? (
                                                <img src={previews[field.key] ?? ''} alt="" className="h-12 w-16 rounded-md border border-border object-cover" />
                                            ) : (
                                                <span className="text-muted-foreground flex h-12 w-16 items-center justify-center rounded-md border border-dashed border-border">
                                                    <ImagePlus className="size-4" />
                                                </span>
                                            )}
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                disabled={!can.update}
                                                onClick={() => setPicking(field.key)}
                                            >
                                                {previews[field.key] ? 'Replace' : 'Choose image'}
                                            </Button>
                                            {previews[field.key] ? (
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={`Remove ${field.label.toLowerCase()}`}
                                                    disabled={!can.update}
                                                    onClick={() => {
                                                        form.setData(field.key, null);
                                                        setPreviews((current) => ({ ...current, [field.key]: null }));
                                                    }}
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                            ) : null}
                                        </div>
                                    ) : field.type === 'select' ? (
                                        <Select
                                            value={String(form.data[field.key] ?? '')}
                                            onValueChange={(value) => form.setData(field.key, value)}
                                            disabled={!can.update}
                                        >
                                            <SelectTrigger id={`settings-${field.key}`} className="max-w-xs">
                                                <SelectValue placeholder="Choose…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {field.options.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : field.type === 'text' ? (
                                        <textarea
                                            id={`settings-${field.key}`}
                                            rows={3}
                                            disabled={!can.update}
                                            value={String(form.data[field.key] ?? '')}
                                            onChange={(event) => form.setData(field.key, event.target.value)}
                                            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px] disabled:opacity-60"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {field.type === 'color' ? (
                                                <input
                                                    type="color"
                                                    aria-label={`${field.label} colour`}
                                                    disabled={!can.update}
                                                    value={String(form.data[field.key] ?? '') || '#4f46e5'}
                                                    onChange={(event) => form.setData(field.key, event.target.value)}
                                                    className="h-9 w-12 rounded-md border border-border bg-transparent"
                                                />
                                            ) : null}
                                            <Input
                                                id={`settings-${field.key}`}
                                                type={
                                                    field.type === 'secret'
                                                        ? 'password'
                                                        : field.type === 'integer'
                                                          ? 'number'
                                                          : field.type === 'email'
                                                            ? 'email'
                                                            : 'text'
                                                }
                                                autoComplete="off"
                                                disabled={!can.update}
                                                placeholder={field.type === 'secret' && field.has_value ? 'Stored — leave blank to keep' : undefined}
                                                value={String(form.data[field.key] ?? '')}
                                                onChange={(event) => form.setData(field.key, event.target.value)}
                                                className="max-w-md"
                                            />
                                        </div>
                                    )}

                                    {form.errors[field.key] ? (
                                        <p className="text-status-error text-xs">{form.errors[field.key]}</p>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <MediaPicker
                open={picking !== null}
                onOpenChange={(open) => setPicking(open ? picking : null)}
                currentUrl={picking !== null ? previews[picking] : null}
                onSelect={(item) => {
                    if (picking === null) {
                        return;
                    }

                    form.setData(picking, item.id);
                    setPreviews((current) => ({ ...current, [picking]: item.thumbnail_url ?? item.url }));
                    setPicking(null);
                }}
            />

            {can.update ? (
                <div
                    className={cn(
                        'bg-background/95 fixed inset-x-0 bottom-0 z-20 border-t border-border backdrop-blur transition-transform md:left-[var(--sidebar-width,16rem)]',
                        form.isDirty || form.processing ? 'translate-y-0' : 'translate-y-full',
                    )}
                >
                    <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-6 py-3">
                        <p className="text-muted-foreground text-xs">
                            {form.processing ? 'Saving…' : form.isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="ghost" size="sm" onClick={() => form.reset()} disabled={!form.isDirty || form.processing}>
                                <RotateCcw className="size-4" />
                                Discard
                            </Button>
                            <Button type="button" size="sm" onClick={save} disabled={!form.isDirty || form.processing}>
                                <Save className="size-4" />
                                {form.processing ? 'Saving…' : 'Save changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </AppLayout>
    );
}

function initial(field: SettingsField): FormValue {
    if (field.type === 'secret') {
        return '';
    }

    if (field.value === null || field.value === undefined) {
        return field.type === 'media' ? null : '';
    }

    return typeof field.value === 'number' ? field.value : String(field.value);
}

/**
 * Booleans save on their own, optimistically: the switch flips immediately and
 * Inertia restores the server props (with a toast) if the save is refused.
 */
function toggleBoolean(field: SettingsField, next: boolean, url: string) {
    router
        .optimistic((props: Props) => ({
            ...props,
            group: {
                ...props.group,
                fields: props.group.fields.map((item) => (item.key === field.key ? { ...item, value: next } : item)),
            },
        }))
        .patch(
            url,
            { [field.key]: next },
            {
                preserveScroll: true,
                preserveState: true,
                onError: (errors: Record<string, string>) => {
                    toast.error('Change reverted', {
                        description: errors[field.key] ?? 'The setting was not saved.',
                    });
                },
            },
        );
}

function Switch({
    id,
    checked,
    disabled,
    label,
    onChange,
}: {
    id: string;
    checked: boolean;
    disabled: boolean;
    label: string;
    onChange: (next: boolean) => void;
}) {
    return (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                checked ? 'bg-primary' : 'bg-input',
                disabled && 'cursor-not-allowed opacity-50',
            )}
        >
            <span
                className={cn(
                    'bg-background size-4 rounded-full shadow transition-transform',
                    checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
                )}
            />
        </button>
    );
}
