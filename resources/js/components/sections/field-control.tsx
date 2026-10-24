import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { MediaField } from '@/components/media/media-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { FieldDef, SectionContent } from '@/lib/sections';
import { rows, str } from '@/lib/sections';

type Props = {
    field: FieldDef;
    value: unknown;
    onChange: (value: unknown) => void;
    error?: string;
    idPrefix: string;
};

/**
 * The inspector is rendered from the section schema — there is no hand-written
 * form per section anywhere in the client.
 */
export function FieldControl({ field, value, onChange, error, idPrefix }: Props) {
    const id = `${idPrefix}-${field.key}`;

    if (field.type === 'repeater') {
        return (
            <RepeaterControl field={field} value={value} onChange={onChange} error={error} idPrefix={idPrefix} />
        );
    }

    return (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={id} className="text-xs font-medium">
                    {field.label}
                    {field.required ? <span className="text-status-error ml-0.5">*</span> : null}
                </Label>
                {field.hint ? (
                    <span className="text-muted-foreground text-[11px]">{field.hint}</span>
                ) : null}
            </div>

            {renderControl(id, field, value, onChange)}

            {error ? <p className="text-status-error text-xs">{error}</p> : null}
        </div>
    );
}

function renderControl(
    id: string,
    field: FieldDef,
    value: unknown,
    onChange: (value: unknown) => void,
) {
    switch (field.type) {
        case 'textarea':
        case 'richtext':
            return (
                <textarea
                    id={id}
                    value={str(value)}
                    onChange={(event) => onChange(event.target.value)}
                    rows={field.type === 'richtext' ? 8 : 3}
                    className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                    placeholder={field.hint ?? ''}
                />
            );

        case 'number':
            return (
                <Input
                    id={id}
                    type="number"
                    value={typeof value === 'number' ? value : 0}
                    onChange={(event) => onChange(Number(event.target.value))}
                />
            );

        case 'boolean':
            return (
                <div className="flex items-center gap-2">
                    <Checkbox
                        id={id}
                        checked={value === true}
                        onCheckedChange={(checked) => onChange(checked === true)}
                    />
                    <span className="text-muted-foreground text-xs">{value === true ? 'On' : 'Off'}</span>
                </div>
            );

        case 'select':
            return (
                <Select value={str(value)} onValueChange={(next) => onChange(next)}>
                    <SelectTrigger id={id}>
                        <SelectValue placeholder="Choose…" />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );

        case 'color':
            return (
                <div className="flex items-center gap-2">
                    <input
                        id={id}
                        type="color"
                        value={toHex(str(value, '#4f46e5'))}
                        onChange={(event) => onChange(event.target.value)}
                        className="border-input size-9 cursor-pointer rounded-md border bg-transparent"
                    />
                    <Input value={str(value)} onChange={(event) => onChange(event.target.value)} className="font-mono text-xs" />
                </div>
            );

        case 'media':
            return (
                <MediaField
                    id={id}
                    value={typeof value === 'string' && value !== '' ? value : null}
                    onChange={(next) => onChange(next)}
                />
            );

        default:
            return (
                <Input
                    id={id}
                    type={field.type === 'url' ? 'url' : 'text'}
                    value={str(value)}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={field.type === 'url' ? 'https://…' : ''}
                />
            );
    }
}

function RepeaterControl({
    field,
    value,
    onChange,
    error,
    idPrefix,
}: {
    field: FieldDef;
    value: unknown;
    onChange: (value: unknown) => void;
    error?: string;
    idPrefix: string;
}) {
    const items = rows(value);

    const update = (index: number, key: string, next: unknown) => {
        const copy = items.map((item, itemIndex) =>
            itemIndex === index ? { ...item, [key]: next } : item,
        );
        onChange(copy);
    };

    const add = () => {
        const blank: SectionContent = {};
        for (const nested of field.fields) {
            blank[nested.key] = nested.type === 'select'
                ? (nested.options[0]?.value ?? '')
                : nested.type === 'boolean'
                  ? false
                  : nested.type === 'number'
                    ? 0
                    : '';
        }
        onChange([...items, blank]);
    };

    const remove = (index: number) => onChange(items.filter((_, itemIndex) => itemIndex !== index));

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">
                    {field.label}
                    {field.required ? <span className="text-status-error ml-0.5">*</span> : null}
                </Label>
                <Button type="button" variant="outline" size="sm" className="h-7" onClick={add}>
                    <Plus className="size-3.5" />
                    Add
                </Button>
            </div>

            {items.length === 0 ? (
                <p className="text-muted-foreground rounded-md border border-dashed border-border px-3 py-4 text-center text-xs">
                    No items yet.
                </p>
            ) : (
                <ul className="space-y-2">
                    {items.map((item, slot) => (
                        // Repeater rows carry no id, so their position is the only stable key.
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        <li key={`${field.key}-${slot}`} className="rounded-md border border-border bg-muted/30 p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                                    <GripVertical className="size-3" />
                                    Item {slot + 1}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    aria-label={`Remove ${field.label} item ${slot + 1}`}
                                    onClick={() => remove(slot)}
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {field.fields.map((nested) => (
                                    <FieldControl
                                        key={nested.key}
                                        field={nested}
                                        value={item[nested.key]}
                                        onChange={(next) => update(slot, nested.key, next)}
                                        idPrefix={`${idPrefix}-${field.key}-${slot}`}
                                    />
                                ))}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {error ? <p className="text-status-error text-xs">{error}</p> : null}
        </div>
    );
}

/**
 * `<input type="color">` only understands hex; OKLCH values fall back to the
 * closest safe default rather than rendering a black swatch.
 */
function toHex(value: string): string {
    return /^#[0-9a-f]{6}$/i.test(value) ? value : '#4f46e5';
}
