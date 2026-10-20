import { Form, Head } from '@inertiajs/react';
import GeneralController from '@/actions/App/Http/Controllers/Settings/GeneralController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/general';

type Props = {
    timezone: string | null;
    locale: string | null;
};

export default function General({ timezone, locale }: Props) {
    return (
        <>
            <Head title="General settings" />

            <h1 className="sr-only">General settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="General"
                    description="Update your timezone and language preferences"
                />

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

                            <div className="grid gap-2">
                                <Label htmlFor="locale">Locale</Label>

                                <Input
                                    id="locale"
                                    className="mt-1 block w-full"
                                    defaultValue={locale ?? ''}
                                    name="locale"
                                    placeholder="en"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.locale}
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
            </div>
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
