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
import { edit, update } from '@/routes/account';

// Must match the locales accepted by AccountSettingsUpdateRequest.
const languages = [
    { value: 'en', label: 'English' },
    { value: 'vi', label: 'Tiếng Việt' },
];

type AccountSettings = {
    date_of_birth: string | null;
    language: string;
    timezone: string | null;
};

type Props = {
    settings: AccountSettings;
} & SecuritySettingsProps;

export default function Account({ settings, ...security }: Props) {
    const form = useForm({
        date_of_birth: settings.date_of_birth ?? '',
        locale: settings.language,
        timezone: settings.timezone ?? '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.transform((data) => ({
            // Empty fields mean "not set", so send null.
            date_of_birth: data.date_of_birth || null,
            locale: data.locale,
            timezone: data.timezone || null,
        }));
        form.patch(update().url, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Account settings" />

            <h1 className="sr-only">Account settings</h1>

            <ContentSection
                title="Account"
                description="Update your date of birth, language, and timezone"
            >
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="date_of_birth">Date of birth</Label>
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
                            Used to personalise your account. Leave empty to
                            keep it private.
                        </p>
                        <InputError message={form.errors.date_of_birth} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="locale">Language</Label>
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
                        <Label htmlFor="timezone">Timezone</Label>
                        <Input
                            id="timezone"
                            className="mt-1 block w-full"
                            value={form.data.timezone}
                            onChange={(event) =>
                                form.setData('timezone', event.target.value)
                            }
                            placeholder="Europe/Berlin"
                        />
                        <InputError message={form.errors.timezone} />
                    </div>

                    <Button type="submit" disabled={form.processing}>
                        Save
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
