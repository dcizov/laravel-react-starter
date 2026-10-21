import { router, usePage } from '@inertiajs/react';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTrans } from '@/hooks/use-trans';
import { guest, update } from '@/routes/language';

// Changes the language. Signed-in users save the choice to their account, so it follows them to every device.
// Guests keep it in the session.
export function LanguageSwitcher() {
    const t = useTrans();
    const { auth, locale, locales } = usePage().props;

    const change = (value: string) => {
        if (value === locale) {
            return;
        }

        if (auth.user) {
            router.patch(
                update().url,
                { locale: value },
                { preserveScroll: true },
            );
        } else {
            router.post(
                guest().url,
                { locale: value },
                { preserveScroll: true },
            );
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t('Change language')}
                        title={t('Change language')}
                        data-test="language-switcher-trigger"
                    />
                }
            >
                <Languages />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuLabel>{t('Language')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={locale} onValueChange={change}>
                    {locales.map((option) => (
                        <DropdownMenuRadioItem
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
