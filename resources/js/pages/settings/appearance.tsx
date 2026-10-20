import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import ContentSection from '@/components/settings/content-section';
import { useTrans } from '@/hooks/use-trans';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    const t = useTrans();

    return (
        <>
            <Head title={t('Appearance settings')} />

            <h1 className="sr-only">{t('Appearance settings')}</h1>

            <ContentSection
                title={t('Appearance settings')}
                description={t(
                    'Update the appearance settings for your account',
                )}
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
