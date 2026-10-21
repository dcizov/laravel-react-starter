import { Head, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AppLogoMark } from '@/components/app-logo';
import ContentSection from '@/components/settings/content-section';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { roleLabels } from '@/components/users/data';
import { useTrans } from '@/hooks/use-trans';
import { edit, update } from '@/routes/admin-settings';

type AdminSettings = {
    app_name: string;
    default_role: string;
    logo_url: string | null;
    custom_error_pages: boolean;
    landing_enabled: boolean;
};

type AdminForm = {
    app_name: string;
    default_role: string;
    logo: File | null;
    remove_logo: boolean;
    custom_error_pages: boolean;
    landing_enabled: boolean;
};

// App-wide settings. Only admins can open this page.
export default function AdminSettingsPage({
    settings,
    roles,
}: {
    settings: AdminSettings;
    roles: string[];
}) {
    const t = useTrans();
    const [fileKey, setFileKey] = useState(0);
    const form = useForm<AdminForm>({
        app_name: settings.app_name,
        default_role: settings.default_role,
        logo: null,
        remove_logo: false,
        custom_error_pages: settings.custom_error_pages,
        landing_enabled: settings.landing_enabled,
    });

    // A preview of the file the admin picked. Revoked when it changes, so the browser does not keep it.
    const preview = useMemo(
        () => (form.data.logo ? URL.createObjectURL(form.data.logo) : null),
        [form.data.logo],
    );

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Files need a multipart POST. The _method field tells Laravel to treat it as the PATCH route.
        form.transform((data) => ({ ...data, _method: 'PATCH' }));
        form.post(update().url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setFileKey((key) => key + 1);
                // The saved state has no pending logo, so the baseline must not keep the uploaded file.
                form.setDefaults({
                    ...form.data,
                    logo: null,
                    remove_logo: false,
                });
                form.setData('logo', null);
                form.setData('remove_logo', false);
            },
        });
    };

    const chooseLogo = (file: File | undefined) => {
        form.setData('logo', file ?? null);
        form.setData('remove_logo', false);
    };

    const removeLogo = () => {
        setFileKey((key) => key + 1);
        form.setData('logo', null);
        form.setData('remove_logo', true);
    };

    const showsCustomLogo =
        (settings.logo_url !== null && !form.data.remove_logo) ||
        form.data.logo !== null;

    return (
        <>
            <Head title={t('Admin settings')} />

            <h1 className="sr-only">{t('Admin settings')}</h1>

            <ContentSection
                title={t('Admin')}
                description={t('Settings that apply to the whole app.')}
            >
                <form onSubmit={submit} encType="multipart/form-data">
                    <FieldGroup>
                        <Field data-invalid={!!form.errors.app_name || undefined}>
                            <FieldLabel htmlFor="app_name">
                                {t('Application name')}
                            </FieldLabel>
                            <Input
                                id="app_name"
                                value={form.data.app_name}
                                onChange={(event) =>
                                    form.setData('app_name', event.target.value)
                                }
                                aria-invalid={!!form.errors.app_name || undefined}
                                maxLength={100}
                                required
                            />
                            <FieldError>{form.errors.app_name}</FieldError>
                        </Field>

                        <Field data-invalid={!!form.errors.logo || undefined}>
                            <FieldLabel htmlFor="logo">{t('Logo')}</FieldLabel>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted p-2">
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt=""
                                            className="size-full object-contain"
                                        />
                                    ) : showsCustomLogo ? (
                                        <img
                                            src={settings.logo_url ?? ''}
                                            alt=""
                                            className="size-full object-contain"
                                        />
                                    ) : (
                                        <AppLogoMark className="size-full fill-current" />
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Input
                                        key={fileKey}
                                        id="logo"
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className="max-w-xs"
                                        aria-invalid={!!form.errors.logo || undefined}
                                        onChange={(event) =>
                                            chooseLogo(event.target.files?.[0])
                                        }
                                    />
                                    <FieldDescription>
                                        {t(
                                            'PNG, JPEG or WebP, up to 2 MB. Shown in the sidebar, header, and sign-in pages.',
                                        )}
                                    </FieldDescription>
                                    {showsCustomLogo && (
                                        <div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={removeLogo}
                                            >
                                                {t('Remove logo')}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <FieldError>{form.errors.logo}</FieldError>
                        </Field>

                        <Field data-invalid={!!form.errors.default_role || undefined}>
                            <FieldLabel htmlFor="default_role">
                                {t('Default role for new accounts')}
                            </FieldLabel>
                            <Select
                                value={form.data.default_role}
                                onValueChange={(value) => {
                                    if (value) {
                                        form.setData('default_role', value);
                                    }
                                }}
                            >
                                <SelectTrigger
                                    id="default_role"
                                    className="w-full max-w-xs"
                                    aria-invalid={!!form.errors.default_role || undefined}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {t(roleLabels[role] ?? role)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError>{form.errors.default_role}</FieldError>
                        </Field>

                        <Field orientation="horizontal">
                            <FieldContent>
                                <FieldLabel htmlFor="custom_error_pages">
                                    {t("Use the app's error pages")}
                                </FieldLabel>
                                <FieldDescription>
                                    {t(
                                        "Off shows Laravel's own error pages instead. Debug mode is set in the server configuration, not here.",
                                    )}
                                </FieldDescription>
                            </FieldContent>
                            <Switch
                                id="custom_error_pages"
                                checked={form.data.custom_error_pages}
                                onCheckedChange={(checked) =>
                                    form.setData('custom_error_pages', checked)
                                }
                            />
                        </Field>

                        <Field orientation="horizontal">
                            <FieldContent>
                                <FieldLabel htmlFor="landing_enabled">
                                    {t('Show the landing page')}
                                </FieldLabel>
                                <FieldDescription>
                                    {t(
                                        'Off sends visitors to sign in, or to the dashboard when signed in. Edit the page in the Visual editor.',
                                    )}
                                </FieldDescription>
                            </FieldContent>
                            <Switch
                                id="landing_enabled"
                                checked={form.data.landing_enabled}
                                onCheckedChange={(checked) =>
                                    form.setData('landing_enabled', checked)
                                }
                            />
                        </Field>

                        <Field orientation="horizontal">
                            <Button
                                type="submit"
                                disabled={form.processing || !form.isDirty}
                            >
                                {form.processing && <Spinner />}
                                {t('Save')}
                            </Button>
                        </Field>
                    </FieldGroup>
                </form>
            </ContentSection>
        </>
    );
}

AdminSettingsPage.layout = {
    breadcrumbs: [
        {
            title: 'Admin settings',
            href: edit(),
        },
    ],
};
