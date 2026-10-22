import { Head, router, useForm } from '@inertiajs/react';
import { ArrowUpRight, Check } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useTrans } from '@/hooks/use-trans';
import { destroy, update } from '@/routes/admin/integrations';

type IntegrationField = {
    key: string;
    label: string;
    secret: boolean;
    // Only for fields that are not secret. Secrets are write-only and never sent to the browser.
    value: string | null;
    // Whether a value is saved. For secrets this is all the browser ever learns.
    configured: boolean;
};

type Integration = {
    key: string;
    name: string;
    description: string;
    favicon: string;
    // 'token': the admin pastes values. 'oauth': the admin signs in with the provider.
    auth: 'token' | 'oauth';
    connected: boolean;
    connectedAt: string | null;
    // False when a sign-in tool is not set up on the server (missing Google client ID or secret).
    available: boolean;
    connectUrl: string | null;
    fields: IntegrationField[];
};

type Props = {
    integrations: Integration[];
};

// The admin catalogue of third-party tools, laid out like the Integrations 02 block from shadcn-ui-blocks (MIT).
// Token tools open a form. Sign-in tools go to the provider and come back here.
export default function IntegrationsIndex({ integrations }: Props) {
    const t = useTrans();
    const [active, setActive] = useState<Integration | null>(null);

    return (
        <>
            <Head title={t('Integrations')} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Integrations')}
                    description={t(
                        'Connect the third-party tools this app uses. Saved keys are encrypted and never shown again.',
                    )}
                />

                <div className="flex flex-col gap-3 rounded-xl border bg-card p-3">
                    {integrations.map((item) => (
                        <div
                            key={item.key}
                            className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-3"
                        >
                            <img
                                alt=""
                                aria-hidden="true"
                                className="size-8 rounded"
                                src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.favicon)}&sz=64`}
                            />
                            <div className="min-w-0 flex-1">
                                <h2 className="font-medium">{item.name}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {item.description}
                                </p>
                            </div>

                            <IntegrationAction
                                item={item}
                                onOpen={() => setActive(item)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <Dialog
                open={active !== null}
                onOpenChange={(open) => !open && setActive(null)}
            >
                {active && (
                    <ConnectForm
                        key={active.key}
                        integration={active}
                        onClose={() => setActive(null)}
                    />
                )}
            </Dialog>
        </>
    );
}

// The right-hand action of a row. Its label and state depend on how the tool connects.
function IntegrationAction({
    item,
    onOpen,
}: {
    item: Integration;
    onOpen: () => void;
}) {
    const t = useTrans();
    const [disconnecting, setDisconnecting] = useState(false);

    if (item.auth === 'oauth') {
        if (item.connected) {
            return (
                <div className="ms-auto flex items-center gap-2">
                    <Badge className="h-7 rounded-lg bg-success/10 px-3 text-sm text-success">
                        <Check />
                        {t('Connected')}
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={disconnecting}
                        onClick={() => {
                            setDisconnecting(true);
                            router.delete(destroy.url(item.key), {
                                preserveScroll: true,
                                onFinish: () => setDisconnecting(false),
                            });
                        }}
                    >
                        {disconnecting && <Spinner />}
                        {t('Disconnect')}
                    </Button>
                </div>
            );
        }

        if (!item.available) {
            return (
                <Badge
                    variant="outline"
                    className="ms-auto h-7 px-3 text-sm text-muted-foreground"
                >
                    {t('Not set up')}
                </Badge>
            );
        }

        return (
            <Button
                size="sm"
                variant="outline"
                className="ms-auto min-w-26"
                nativeButton={false}
                render={<a href={item.connectUrl ?? undefined} />}
            >
                {t('Connect')}
                <ArrowUpRight />
            </Button>
        );
    }

    if (item.connected) {
        return (
            <div className="ms-auto flex items-center gap-2">
                <Badge className="h-7 rounded-lg bg-success/10 px-3 text-sm text-success">
                    <Check />
                    {t('Connected')}
                </Badge>
                <Button variant="outline" size="sm" onClick={onOpen}>
                    {t('Manage')}
                </Button>
            </div>
        );
    }

    return (
        <Button
            size="sm"
            variant="outline"
            className="ms-auto min-w-26"
            onClick={onOpen}
        >
            {t('Connect')}
            <ArrowUpRight />
        </Button>
    );
}

function ConnectForm({
    integration,
    onClose,
}: {
    integration: Integration;
    onClose: () => void;
}) {
    const t = useTrans();

    // Secret fields start empty. Blank on save keeps the saved value.
    const form = useForm<Record<string, string>>(
        Object.fromEntries(
            integration.fields.map((field) => [
                field.key,
                field.secret ? '' : (field.value ?? ''),
            ]),
        ),
    );

    // A saved secret is shown as "Saved" until the admin chooses to replace it.
    const [replacing, setReplacing] = useState<Record<string, boolean>>({});

    const setReplacingField = (key: string, value: boolean) => {
        setReplacing((current) => ({ ...current, [key]: value }));

        if (!value) {
            form.setData(key, '');
            form.clearErrors(key);
        }
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(update.url(integration.key), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    const disconnect = () => {
        router.delete(destroy.url(integration.key), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{integration.name}</DialogTitle>
                <DialogDescription>{integration.description}</DialogDescription>
            </DialogHeader>

            <form onSubmit={submit} className="space-y-4">
                {integration.fields.map((field) => {
                    const id = `integration-${integration.key}-${field.key}`;
                    const error = form.errors[field.key];
                    const isSaved =
                        field.secret &&
                        field.configured &&
                        !replacing[field.key];

                    return (
                        <Field
                            key={field.key}
                            data-invalid={!!error || undefined}
                        >
                            <FieldLabel htmlFor={isSaved ? undefined : id}>
                                {field.label}
                            </FieldLabel>

                            {isSaved ? (
                                <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span
                                            aria-hidden="true"
                                            className="font-mono tracking-widest text-muted-foreground"
                                        >
                                            ••••••••
                                        </span>
                                        <Badge variant="secondary">
                                            <Check />
                                            {t('Saved')}
                                        </Badge>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        aria-label={t('Replace :field', {
                                            field: field.label,
                                        })}
                                        onClick={() =>
                                            setReplacingField(field.key, true)
                                        }
                                    >
                                        {t('Replace')}
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Input
                                        id={id}
                                        type={
                                            field.secret ? 'password' : 'text'
                                        }
                                        autoComplete="off"
                                        value={form.data[field.key] ?? ''}
                                        onChange={(event) =>
                                            form.setData(
                                                field.key,
                                                event.target.value,
                                            )
                                        }
                                        placeholder={
                                            field.secret
                                                ? t('Enter the new value')
                                                : ''
                                        }
                                        aria-invalid={!!error || undefined}
                                    />
                                    {field.secret && field.configured && (
                                        <button
                                            type="button"
                                            className="self-start text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                                            onClick={() =>
                                                setReplacingField(
                                                    field.key,
                                                    false,
                                                )
                                            }
                                        >
                                            {t('Keep the saved value')}
                                        </button>
                                    )}
                                </>
                            )}

                            <FieldError>{error}</FieldError>
                        </Field>
                    );
                })}

                <DialogFooter>
                    {integration.connected && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={disconnect}
                            disabled={form.processing}
                        >
                            {t('Disconnect')}
                        </Button>
                    )}
                    <Button type="submit" disabled={form.processing}>
                        {form.processing && <Spinner />}
                        {integration.connected ? t('Save') : t('Connect')}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
