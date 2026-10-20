import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import ContentSection from '@/components/settings/content-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { roleLabels } from '@/components/users/data';
import { useTrans } from '@/hooks/use-trans';
import { edit, update } from '@/routes/admin-settings';

type AdminSettings = {
    app_name: string;
    default_role: string;
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
    const form = useForm<AdminSettings>(settings);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.patch(update().url, { preserveScroll: true });
    };

    return (
        <>
            <Head title={t('Admin settings')} />

            <h1 className="sr-only">{t('Admin settings')}</h1>

            <ContentSection
                title={t('Admin')}
                description={t('Settings that apply to the whole app.')}
            >
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="app_name">
                            {t('Application name')}
                        </Label>
                        <Input
                            id="app_name"
                            value={form.data.app_name}
                            onChange={(event) =>
                                form.setData('app_name', event.target.value)
                            }
                            maxLength={100}
                            required
                        />
                        <InputError message={form.errors.app_name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="default_role">
                            {t('Default role for new accounts')}
                        </Label>
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
                        <InputError message={form.errors.default_role} />
                    </div>

                    <Button type="submit" disabled={form.processing}>
                        {form.processing && <Spinner />}
                        {t('Save')}
                    </Button>
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
