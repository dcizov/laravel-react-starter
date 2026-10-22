import { router, usePage } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import {
    NativeSelect,
    NativeSelectOption,
} from '@/components/ui/native-select';
import { useTrans } from '@/hooks/use-trans';

// Chooses the site the admin works on. Lists and forms then show that site's content only. Shown on admin pages only.
export function SiteSwitcher() {
    const t = useTrans();
    const { sites, site } = usePage().props;

    if (!sites || sites.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-1 px-2 pb-2 group-data-[collapsible=icon]:hidden">
            <Label
                htmlFor="admin-site-switcher"
                className="text-xs text-muted-foreground"
            >
                {t('Site')}
            </Label>
            <NativeSelect
                id="admin-site-switcher"
                value={String(site.id)}
                onChange={(event) =>
                    router.post(
                        '/admin/sites/switch',
                        { site_id: Number(event.target.value) },
                        { preserveScroll: false },
                    )
                }
            >
                {sites.map((item) => (
                    <NativeSelectOption key={item.id} value={String(item.id)}>
                        {item.isDefault
                            ? `${item.name} (${t('default')})`
                            : item.name}
                    </NativeSelectOption>
                ))}
            </NativeSelect>
        </div>
    );
}

export default SiteSwitcher;
