import { Head, router, useForm } from '@inertiajs/react';
import { Check } from 'lucide-react';
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
    // Only for fields that are not secret. Secret values are never sent to the browser.
    value: string | null;
    // Whether a value has been saved, for secret and other fields alike.
    configured: boolean;
};

type Integration = {
    key: string;
    name: string;
    description: string;
    connected: boolean;
    connectedAt: string | null;
    fields: IntegrationField[];
};

type Props = {
    integrations: Integration[];
    secretMask: string;
};

// The admin catalogue of third-party tools. Connecting a tool saves its keys, encrypted on the server.
export default function IntegrationsIndex({ integrations, secretMask }: Props) {
    const t = useTrans();
    const [active, setActive] = useState<Integration | null>(null);

    return (
        <>
            <Head title={t('Integrations')} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Integrations')}
                    description={t(
                        'Connect the third-party tools this app uses. Secret keys are encrypted and never shown again.',
                    )}
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {integrations.map((item) => (
                        <div
                            key={item.key}
                            className="flex flex-col gap-4 rounded-xl border p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                                    {item.name.charAt(0)}
                                </div>
                                {item.connected && (
                                    <Badge variant="secondary">
                                        <Check />
                                        {t('Connected')}
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h2 className="font-medium">{item.name}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {item.description}
                                </p>
                            </div>

                            <div className="mt-auto">
                                <Button
                                    variant={
                                        item.connected ? 'outline' : 'default'
                                    }
                                    onClick={() => setActive(item)}
                                >
                                    {item.connected
                                        ? t('Manage')
                                        : t('Connect')}
                                </Button>
                            </div>
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
                        secretMask={secretMask}
                        onClose={() => setActive(null)}
                    />
                )}
            </Dialog>
        </>
    );
}

function ConnectForm({
    integration,
    secretMask,
    onClose,
}: {
    integration: Integration;
    secretMask: string;
    onClose: () => void;
}) {
    const t = useTrans();

    // Secret fields start empty. A blank secret keeps the saved value.
    const form = useForm<Record<string, string>>(
        Object.fromEntries(
            integration.fields.map((field) => [
                field.key,
                field.secret ? '' : (field.value ?? ''),
            ]),
        ),
    );

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

                    return (
                        <Field
                            key={field.key}
                            data-invalid={!!error || undefined}
                        >
                            <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
                            <Input
                                id={id}
                                type={field.secret ? 'password' : 'text'}
                                autoComplete="off"
                                value={form.data[field.key] ?? ''}
                                onChange={(event) =>
                                    form.setData(field.key, event.target.value)
                                }
                                placeholder={
                                    field.secret && field.configured
                                        ? secretMask
                                        : ''
                                }
                                aria-invalid={!!error || undefined}
                            />
                            {field.secret && field.configured && (
                                <p className="text-xs text-muted-foreground">
                                    {t('Saved. Leave blank to keep it.')}
                                </p>
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
