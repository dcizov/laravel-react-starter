import { Form, Head } from '@inertiajs/react';
import GeneralController from '@/actions/App/Http/Controllers/Settings/GeneralController';
import ContentSection from '@/components/settings/content-section';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/general';

type Props = {
    timezone: string | null;
};

export default function General({ timezone }: Props) {
    return (
        <>
            <Head title="General settings" />

            <h1 className="sr-only">General settings</h1>

            <ContentSection
                title="General"
                description="Update your timezone and language preferences"
            >
                <Form
                    {...GeneralController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="timezone">Timezone</Label>

                                <Input
                                    id="timezone"
                                    className="mt-1 block w-full"
                                    defaultValue={timezone ?? ''}
                                    name="timezone"
                                    placeholder="UTC"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.timezone}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button type="submit" disabled={processing}>
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </ContentSection>
        </>
    );
}

General.layout = {
    breadcrumbs: [
        {
            title: 'General settings',
            href: edit(),
        },
    ],
};
