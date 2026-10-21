import { Shuffle } from 'lucide-react';
import { useId } from 'react';
import { ImageField } from '@/components/landing/block-fields';
import {
    ANIMATION_LABELS,
    FONT_LABELS,
    HEADING_LABELS,
    PADDING_LABELS,
    resolveStyle,
    VARIANT_NAMES,
    variantCount,
    WIDTH_LABELS,
} from '@/components/landing/block-types';
import type {
    Align,
    Animation,
    BlockStyle,
    FontChoice,
    HeadingSize,
    LandingBlock,
    Padding,
    Width,
} from '@/components/landing/block-types';
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
import { useTrans } from '@/hooks/use-trans';

// The design settings of the selected block: layout, colours, background, sizes, font, and animation.
// Each change is passed up as the whole block, with the style merged into what the block already has.
export function BlockDesign({
    block,
    onChange,
    onError,
}: {
    block: LandingBlock;
    onChange: (block: LandingBlock) => void;
    onError: (message: string) => void;
}) {
    const t = useTrans();
    const style = resolveStyle(block);
    const count = variantCount(block.type);
    const id = useId();

    const set = (patch: BlockStyle) =>
        onChange({ ...block, style: { ...style, ...patch } } as LandingBlock);

    // Picks a different layout at random. Useful for trying the page's options quickly.
    const shuffle = () => {
        if (count < 2) {
            return;
        }

        const offset = 1 + Math.floor(Math.random() * (count - 1));
        set({ variant: (style.variant + offset) % count });
    };

    return (
        <FieldGroup>
            <Field>
                <FieldLabel htmlFor={`${id}-variant`}>{t('Layout')}</FieldLabel>
                <div className="flex items-center gap-2">
                    <NativeSelect
                        id={`${id}-variant`}
                        className="flex-1"
                        value={style.variant}
                        onChange={(event) =>
                            set({ variant: Number(event.target.value) })
                        }
                    >
                        {VARIANT_NAMES[block.type].map((name, index) => (
                            <NativeSelectOption key={name} value={index}>
                                {t(name)}
                            </NativeSelectOption>
                        ))}
                    </NativeSelect>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={t('Shuffle layout')}
                        title={t('Shuffle layout')}
                        disabled={count < 2}
                        onClick={shuffle}
                    >
                        <Shuffle />
                    </Button>
                </div>
            </Field>

            <ColorField
                id={`${id}-bg`}
                label={t('Background colour')}
                value={style.bg_color}
                fallback="#ffffff"
                clearLabel={t('Use page background')}
                onChange={(value) => set({ bg_color: value })}
            />

            <ImageField
                label={t('Background image')}
                value={style.bg_image}
                onChange={(value) => set({ bg_image: value })}
                onError={onError}
            />

            {style.bg_image && (
                <Field>
                    <FieldLabel htmlFor={`${id}-overlay`}>
                        {t('Image darkness')}: {style.bg_overlay}%
                    </FieldLabel>
                    <input
                        id={`${id}-overlay`}
                        type="range"
                        min={0}
                        max={80}
                        step={5}
                        value={style.bg_overlay}
                        onChange={(event) =>
                            set({ bg_overlay: Number(event.target.value) })
                        }
                        className="w-full accent-primary"
                    />
                    <FieldDescription>
                        {t(
                            'A dark layer over the image keeps the text easy to read.',
                        )}
                    </FieldDescription>
                </Field>
            )}

            <ColorField
                id={`${id}-text`}
                label={t('Text colour')}
                value={style.text_color}
                fallback="#0a0a0a"
                clearLabel={t('Use theme text colour')}
                onChange={(value) => set({ text_color: value })}
            />

            <SelectField
                id={`${id}-width`}
                label={t('Width')}
                value={style.width}
                onChange={(value) => set({ width: value as Width })}
                options={Object.entries(WIDTH_LABELS).map(([value, label]) => [
                    value,
                    t(label),
                ])}
            />

            <SelectField
                id={`${id}-padding`}
                label={t('Spacing above and below')}
                value={style.padding}
                onChange={(value) => set({ padding: value as Padding })}
                options={Object.entries(PADDING_LABELS).map(
                    ([value, label]) => [value, t(label)],
                )}
            />

            <SelectField
                id={`${id}-align`}
                label={t('Alignment')}
                value={style.align}
                onChange={(value) => set({ align: value as Align })}
                options={[
                    ['center', t('Centred')],
                    ['left', t('Left')],
                ]}
            />

            <SelectField
                id={`${id}-heading`}
                label={t('Heading size')}
                value={style.heading_size}
                onChange={(value) =>
                    set({ heading_size: value as HeadingSize })
                }
                options={Object.entries(HEADING_LABELS).map(
                    ([value, label]) => [value, t(label)],
                )}
            />

            <SelectField
                id={`${id}-font`}
                label={t('Font')}
                value={style.font}
                onChange={(value) => set({ font: value as FontChoice })}
                options={Object.entries(FONT_LABELS).map(([value, label]) => [
                    value,
                    t(label),
                ])}
            />

            <SelectField
                id={`${id}-animation`}
                label={t('Entrance animation')}
                hint={t(
                    'Animations are skipped for visitors who ask for less motion.',
                )}
                value={style.animation}
                onChange={(value) => set({ animation: value as Animation })}
                options={Object.entries(ANIMATION_LABELS).map(
                    ([value, label]) => [value, t(label)],
                )}
            />
        </FieldGroup>
    );
}

function SelectField({
    id,
    label,
    hint,
    value,
    options,
    onChange,
}: {
    id: string;
    label: string;
    hint?: string;
    value: string;
    options: [string, string][];
    onChange: (value: string) => void;
}) {
    return (
        <Field>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <NativeSelect
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map(([optionValue, optionLabel]) => (
                    <NativeSelectOption key={optionValue} value={optionValue}>
                        {optionLabel}
                    </NativeSelectOption>
                ))}
            </NativeSelect>
            {hint && <FieldDescription>{hint}</FieldDescription>}
        </Field>
    );
}

// A colour input with a hex readout. An empty value means "use the theme", shown with the clear button.
function ColorField({
    id,
    label,
    value,
    fallback,
    clearLabel,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    fallback: string;
    clearLabel: string;
    onChange: (value: string) => void;
}) {
    const t = useTrans();

    return (
        <Field>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <div className="flex items-center gap-2">
                <input
                    id={id}
                    type="color"
                    value={value || fallback}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
                />
                <span className="font-mono text-sm text-muted-foreground">
                    {value || t('Theme')}
                </span>
                {value && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange('')}
                    >
                        {clearLabel}
                    </Button>
                )}
            </div>
        </Field>
    );
}
