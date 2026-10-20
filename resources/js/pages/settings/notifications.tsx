import { Head, useForm } from '@inertiajs/react';
import ContentSection from '@/components/settings/content-section';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FieldError } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { useTrans } from '@/hooks/use-trans';
import { edit, update } from '@/routes/notifications';

type NotificationType = 'all' | 'mentions' | 'none';

type NotificationSettings = {
    type: NotificationType;
    mobile: boolean;
    communication_emails: boolean;
    social_emails: boolean;
    marketing_emails: boolean;
    security_emails: boolean;
};

const notificationTypes: { value: NotificationType; label: string }[] = [
    { value: 'all', label: 'All new messages' },
    { value: 'mentions', label: 'Direct messages and mentions' },
    { value: 'none', label: 'Nothing' },
];

const emailChannels: {
    key: Exclude<keyof NotificationSettings, 'type' | 'mobile'>;
    label: string;
}[] = [
    { key: 'communication_emails', label: 'Communication emails' },
    { key: 'social_emails', label: 'Social emails' },
    { key: 'marketing_emails', label: 'Marketing emails' },
    { key: 'security_emails', label: 'Security emails' },
];

export default function Notifications({
    settings,
}: {
    settings: NotificationSettings;
}) {
    const t = useTrans();
    const form = useForm<NotificationSettings>(settings);

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.patch(update().url, { preserveScroll: true });
    };

    return (
        <>
            <Head title={t('Notification settings')} />

            <h1 className="sr-only">{t('Notification settings')}</h1>

            <ContentSection
                title={t('Notifications')}
                description={t('Choose how and when you are notified.')}
            >
                <Alert>
                    <AlertTitle className="flex items-center gap-2">
                        {t('Under construction')}
                        <Badge variant="secondary">
                            {t('Work in progress')}
                        </Badge>
                    </AlertTitle>
                    <AlertDescription>
                        {t(
                            'Only security emails are sent for now. The other choices are saved, but they do not change anything yet.',
                        )}
                    </AlertDescription>
                </Alert>

                <form onSubmit={submit} className="space-y-8">
                    <div className="grid gap-3">
                        <h4 className="text-sm font-medium">
                            {t('Notify me about')}
                        </h4>
                        <RadioGroup
                            value={form.data.type}
                            onValueChange={(value) =>
                                form.setData('type', value as NotificationType)
                            }
                        >
                            {notificationTypes.map((option) => (
                                <div
                                    key={option.value}
                                    className="flex items-center gap-2"
                                >
                                    <RadioGroupItem
                                        id={`notify-${option.value}`}
                                        value={option.value}
                                    />
                                    <Label htmlFor={`notify-${option.value}`}>
                                        {t(option.label)}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                        <FieldError>{form.errors.type}</FieldError>
                    </div>

                    <div className="grid gap-3">
                        <h4 className="text-sm font-medium">{t('Email')}</h4>
                        {emailChannels.map((channel) => (
                            <Field orientation="horizontal" key={channel.key}>
                                <Switch
                                    id={`notify-${channel.key}`}
                                    checked={form.data[channel.key]}
                                    onCheckedChange={(checked) =>
                                        form.setData(channel.key, checked)
                                    }
                                />
                                <Label htmlFor={`notify-${channel.key}`}>
                                    {t(channel.label)}
                                </Label>
                            </Field>
                        ))}
                    </div>

                    <div className="grid gap-3">
                        <h4 className="text-sm font-medium">{t('Mobile')}</h4>
                        <Field orientation="horizontal">
                            <Switch
                                id="notify-mobile"
                                checked={form.data.mobile}
                                onCheckedChange={(checked) =>
                                    form.setData('mobile', checked)
                                }
                            />
                            <Label htmlFor="notify-mobile">
                                {t('Push notifications on mobile')}
                            </Label>
                        </Field>
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

Notifications.layout = {
    breadcrumbs: [
        {
            title: 'Notification settings',
            href: edit(),
        },
    ],
};
