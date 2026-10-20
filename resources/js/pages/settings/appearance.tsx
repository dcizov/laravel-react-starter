import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import ContentSection from '@/components/settings/content-section';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Appearance settings" />

            <h1 className="sr-only">Appearance settings</h1>

            <ContentSection
                title="Appearance settings"
                description="Update the appearance settings for your account"
            >
                <AppearanceTabs />
            </ContentSection>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
