import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import ContentSection from '@/components/settings/content-section';
import SecuritySettings, {
    type SecuritySettingsProps,
} from '@/components/settings/security-settings';
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
import { Separator } from '@/components/ui/separator';
import { useTrans } from '@/hooks/use-trans';
import { edit, update } from '@/routes/account';

type Option = { value: string; label: string };

type AccountSettings = {
    date_of_birth: string | null;
    language: string;
    timezone: string;
};

type Props = {
    settings: AccountSettings;
    // Languages come from App\Support\Locales and timezones from App\Support\Timezones.
    languages: Option[];
    timezones: string[];
} & SecuritySettingsProps;

export default function Account({
    settings,
    languages,
    timezones,
    ...security
}: Props) {
    const t = useTrans();
    const form = useForm({
        date_of_birth: settings.date_of_birth ?? '',
        locale: settings.language,
        timezone: settings.timezone,
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.transform((data) => ({
            // An empty date means "not set", so send null.
            date_of_birth: data.date_of_birth || null,
            locale: data.locale,
            timezone: data.timezone,
        }));
        form.patch(update().url, { preserveScroll: true });
    };

    return (
        <>
            <Head title={t('Account settings')} />

            <h1 className="sr-only">{t('Account settings')}</h1>

            <ContentSection
                title={t('Account')}
                description={t(
                    'Update your date of birth, language, and timezone',
                )}
            >
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="date_of_birth">
                            {t('Date of birth')}
                        </Label>
                        <Input
                            id="date_of_birth"
                            type="date"
                            className="mt-1 block w-full"
                            value={form.data.date_of_birth}
                            onChange={(event) =>
                                form.setData(
                                    'date_of_birth',
                                    event.target.value,
                                )
                            }
                        />
                        <p className="text-sm text-muted-foreground">
                            {t(
                                'Used to personalise your account. Leave empty to keep it private.',
                            )}
                        </p>
                        <InputError message={form.errors.date_of_birth} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="locale">{t('Language')}</Label>
                        <Select
                            value={form.data.locale}
                            onValueChange={(value) =>
                                form.setData('locale', value ?? 'en')
                            }
                        >
                            <SelectTrigger id="locale" className="w-full">
                                <SelectValue>
                                    {(value: string) =>
                                        languages.find(
                                            (language) =>
                                                language.value === value,
                                        )?.label ?? null
                                    }
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map((language) => (
                                    <SelectItem
                                        key={language.value}
                                        value={language.value}
                                    >
                                        {language.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.locale} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="timezone">{t('Timezone')}</Label>
                        <Select
                            value={form.data.timezone}
                            onValueChange={(value) =>
                                form.setData('timezone', value ?? 'UTC')
                            }
                        >
                            <SelectTrigger id="timezone" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {timezones.map((zone) => (
                                    <SelectItem key={zone} value={zone}>
                                        {zone}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            {t(
                                'Used to show times on your profile in your local time.',
                            )}
                        </p>
                        <InputError message={form.errors.timezone} />
                    </div>

                    <Button type="submit" disabled={form.processing}>
                        {t('Save')}
                    </Button>
                </form>
            </ContentSection>

            <Separator className="my-12" />

            <SecuritySettings {...security} />
        </>
    );
}

Account.layout = {
    breadcrumbs: [
        {
            title: 'Account settings',
            href: edit(),
        },
    ],
};
