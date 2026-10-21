import { Copy } from 'lucide-react';
import { useId } from 'react';
import type { LandingTheme } from '@/components/landing/theme';
import { THEME_PRESETS, themeCss } from '@/components/landing/theme';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import {
    NativeSelect,
    NativeSelectOption,
} from '@/components/ui/native-select';
import { toast } from '@/components/ui/toast';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

// The page theme, in the style of tweakcn: pick a preset, then adjust the colours, radius, and fonts.
// Every change shows on the canvas straight away, and the theme can be copied as CSS variables.
export function ThemePanel({
    theme,
    onChange,
}: {
    theme: LandingTheme;
    onChange: (theme: LandingTheme) => void;
}) {
    const t = useTrans();
    const id = useId();

    const set = (patch: Partial<LandingTheme>) =>
        onChange({ ...theme, ...patch });

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(themeCss(theme));
            toast.add({ type: 'success', title: t('Theme CSS copied.') });
        } catch {
            toast.add({
                type: 'error',
                title: t('The theme could not be copied.'),
            });
        }
    };

    return (
        <FieldGroup>
            <Field>
                <FieldLabel>{t('Presets')}</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                    {THEME_PRESETS.map((preset) => {
                        const active =
                            JSON.stringify(preset.theme) ===
                            JSON.stringify(theme);

                        return (
                            <button
                                key={preset.key}
                                type="button"
                                aria-pressed={active}
                                onClick={() => onChange(preset.theme)}
                                className={cn(
                                    'flex items-center gap-2 rounded-md border px-2 py-2 text-left text-sm hover:bg-muted',
                                    active && 'border-ring ring-2 ring-ring/40',
                                )}
                            >
                                <span
                                    aria-hidden="true"
                                    className="flex shrink-0 overflow-hidden rounded-full border"
                                >
                                    <span
                                        className="size-4"
                                        style={{
                                            backgroundColor:
                                                preset.theme.primary,
                                        }}
                                    />
                                    <span
                                        className="size-4"
                                        style={{
                                            backgroundColor:
                                                preset.theme.background,
                                        }}
                                    />
                                </span>
                                {t(preset.label)}
                            </button>
                        );
                    })}
                </div>
            </Field>

            <ThemeColor
                id={`${id}-primary`}
                label={t('Primary colour')}
                value={theme.primary}
                onChange={(value) => set({ primary: value })}
            />
            <ThemeColor
                id={`${id}-background`}
                label={t('Page background')}
                value={theme.background}
                onChange={(value) => set({ background: value })}
            />
            <ThemeColor
                id={`${id}-foreground`}
                label={t('Text colour')}
                value={theme.foreground}
                onChange={(value) => set({ foreground: value })}
            />

            <Field>
                <FieldLabel htmlFor={`${id}-radius`}>
                    {t('Corner radius')}: {theme.radius}rem
                </FieldLabel>
                <input
                    id={`${id}-radius`}
                    type="range"
                    min={0}
                    max={1.5}
                    step={0.125}
                    value={theme.radius}
                    onChange={(event) =>
                        set({ radius: Number(event.target.value) })
                    }
                    className="w-full accent-primary"
                />
            </Field>

            <Field>
                <FieldLabel htmlFor={`${id}-font`}>{t('Font')}</FieldLabel>
                <NativeSelect
                    id={`${id}-font`}
                    value={theme.font}
                    onChange={(event) =>
                        set({
                            font: event.target.value as LandingTheme['font'],
                        })
                    }
                >
                    <NativeSelectOption value="sans">
                        {t('Sans-serif')}
                    </NativeSelectOption>
                    <NativeSelectOption value="serif">
                        {t('Serif')}
                    </NativeSelectOption>
                    <NativeSelectOption value="mono">
                        {t('Monospace')}
                    </NativeSelectOption>
                </NativeSelect>
            </Field>

            <Field>
                <FieldLabel htmlFor={`${id}-size`}>{t('Text size')}</FieldLabel>
                <NativeSelect
                    id={`${id}-size`}
                    value={theme.text_size}
                    onChange={(event) =>
                        set({
                            text_size: event.target
                                .value as LandingTheme['text_size'],
                        })
                    }
                >
                    <NativeSelectOption value="sm">
                        {t('Small')}
                    </NativeSelectOption>
                    <NativeSelectOption value="md">
                        {t('Medium')}
                    </NativeSelectOption>
                    <NativeSelectOption value="lg">
                        {t('Large')}
                    </NativeSelectOption>
                </NativeSelect>
                <FieldDescription>
                    {t(
                        'Sets the size of body text. Headings use their own size in each block.',
                    )}
                </FieldDescription>
            </Field>

            <Button type="button" variant="outline" onClick={copy}>
                <Copy />
                {t('Copy theme CSS')}
            </Button>
        </FieldGroup>
    );
}

function ThemeColor({
    id,
    label,
    value,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <Field>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <div className="flex items-center gap-2">
                <input
                    id={id}
                    type="color"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
                />
                <span className="font-mono text-sm text-muted-foreground">
                    {value}
                </span>
            </div>
        </Field>
    );
}
