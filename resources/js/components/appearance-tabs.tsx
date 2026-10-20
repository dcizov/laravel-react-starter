import { Monitor, Moon, Sun } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

const themes: {
    value: Appearance;
    label: string;
    icon: typeof Sun;
}[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
];

// Small drawing of each theme, in the same style as the sidebar and font cards.
function ThemePreview({ value }: { value: Appearance }) {
    const block = (dark: boolean) => (
        <div
            className={cn(
                'flex h-full flex-1 flex-col gap-1.5 p-2',
                dark ? 'bg-zinc-950' : 'bg-zinc-100',
            )}
        >
            <div
                className={cn(
                    'h-2 w-3/4 rounded-full',
                    dark ? 'bg-zinc-600' : 'bg-zinc-300',
                )}
            />
            <div
                className={cn(
                    'mt-auto h-6 rounded-md shadow-sm',
                    dark ? 'bg-zinc-800' : 'bg-white',
                )}
            />
        </div>
    );

    if (value === 'system') {
        return (
            <div
                aria-hidden="true"
                className="flex h-20 overflow-hidden rounded-md border"
            >
                {block(false)}
                {block(true)}
            </div>
        );
    }

    return (
        <div
            aria-hidden="true"
            className="flex h-20 overflow-hidden rounded-md border"
        >
            {block(value === 'dark')}
        </div>
    );
}

// Light, dark, and system. These apply right away on this device, so there is no save button.
export default function AppearanceTabs() {
    const t = useTrans();
    const { appearance, updateAppearance } = useAppearance();

    return (
        <div className="grid gap-2">
            <RadioGroup
                value={appearance}
                onValueChange={(value) => updateAppearance(value as Appearance)}
                className="grid gap-4 sm:grid-cols-3"
            >
                {themes.map((theme) => {
                    const selected = appearance === theme.value;
                    const Icon = theme.icon;

                    return (
                        <Label
                            key={theme.value}
                            htmlFor={`theme-${theme.value}`}
                            className={cn(
                                'flex cursor-pointer flex-col gap-3 rounded-xl border p-3 font-normal transition-colors hover:bg-muted/50',
                                selected && 'border-primary bg-muted/40',
                            )}
                        >
                            <ThemePreview value={theme.value} />
                            <span className="flex items-center gap-3">
                                <RadioGroupItem
                                    id={`theme-${theme.value}`}
                                    value={theme.value}
                                />
                                <Icon
                                    aria-hidden="true"
                                    className="size-4 text-muted-foreground"
                                />
                                <span className="font-medium">
                                    {t(theme.label)}
                                </span>
                            </span>
                        </Label>
                    );
                })}
            </RadioGroup>
        </div>
    );
}
