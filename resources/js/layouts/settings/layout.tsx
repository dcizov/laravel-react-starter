import type { PropsWithChildren } from 'react';
import SettingsSidebarNav from '@/components/settings/sidebar-nav';
import { settingsNavItems } from '@/components/settings/nav-items';
import Heading from '@/components/heading';
import { useTrans } from '@/hooks/use-trans';
import { Separator } from '@/components/ui/separator';

export default function SettingsLayout({ children }: PropsWithChildren) {
    const t = useTrans();

    return (
        <div className="px-4 py-6">
            <Heading
                title={t('Settings')}
                description={t('Manage your profile and account settings')}
            />

            <div className="flex flex-col md:flex-row md:space-x-12">
                <aside className="w-full md:w-48 md:shrink-0">
                    <SettingsSidebarNav items={settingsNavItems} />
                </aside>

                <Separator className="my-6 md:hidden" />

                <div className="flex-1 md:max-w-2xl">
                    <section className="max-w-xl space-y-12">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
