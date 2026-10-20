import { Check, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type Appearance, useAppearance } from '@/hooks/use-appearance';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

const themes: { value: Appearance; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
];

// Header theme menu: light, dark, or system, applied on this device.
export function ThemeSwitch() {
    const t = useTrans();
    const { appearance, resolvedAppearance, updateAppearance } =
        useAppearance();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        data-test="theme-switch-trigger"
                    />
                }
            >
                {resolvedAppearance === 'dark' ? <Moon /> : <Sun />}
                <span className="sr-only">{t('Toggle theme')}</span>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-40">
                {themes.map((theme) => (
                    <DropdownMenuItem
                        key={theme.value}
                        onClick={() => updateAppearance(theme.value)}
                    >
                        {t(theme.label)}
                        <Check
                            aria-hidden="true"
                            className={cn(
                                'ml-auto',
                                appearance !== theme.value && 'invisible',
                            )}
                        />
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
