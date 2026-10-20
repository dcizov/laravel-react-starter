import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import ContentSection from '@/components/settings/content-section';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
    const form = useForm<NotificationSettings>(settings);

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.patch(update().url, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Notification settings" />

            <h1 className="sr-only">Notification settings</h1>

            <ContentSection
                title="Notifications"
                description="Choose how and when you are notified."
            >
                <form onSubmit={submit} className="space-y-8">
                    <div className="grid gap-3">
                        <h4 className="text-sm font-medium">Notify me about</h4>
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
                                        {option.label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                        <InputError message={form.errors.type} />
                    </div>

                    <div className="grid gap-3">
                        <h4 className="text-sm font-medium">Email</h4>
                        {emailChannels.map((channel) => (
                            <div
                                key={channel.key}
                                className="flex items-center gap-2"
                            >
                                <Checkbox
                                    id={`notify-${channel.key}`}
                                    checked={form.data[channel.key]}
                                    onCheckedChange={(checked) =>
                                        form.setData(channel.key, checked)
                                    }
                                />
                                <Label htmlFor={`notify-${channel.key}`}>
                                    {channel.label}
                                </Label>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-3">
                        <h4 className="text-sm font-medium">Mobile</h4>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="notify-mobile"
                                checked={form.data.mobile}
                                onCheckedChange={(checked) =>
                                    form.setData('mobile', checked)
                                }
                            />
                            <Label htmlFor="notify-mobile">
                                Push notifications on mobile
                            </Label>
                        </div>
                    </div>

                    <Button type="submit" disabled={form.processing}>
                        Save
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
