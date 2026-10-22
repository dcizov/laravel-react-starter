import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { useId } from 'react';
import { ImageField } from '@/components/image-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    NativeSelect,
    NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useTrans } from '@/hooks/use-trans';
import type { BlockType, ContentBlock, CtaOption } from '@/types/cms';

export const BLOCK_TYPES: BlockType[] = [
    'heading',
    'paragraph',
    'quote',
    'list',
    'image',
    'code',
    'divider',
    'cta',
];

// Creates a block with empty content. The id is only needed until the block is saved, and the server keeps it.
export function newBlock(type: BlockType): ContentBlock {
    const id = crypto.randomUUID();

    switch (type) {
        case 'heading':
            return { id, type, data: { level: 2, text: '' } };
        case 'paragraph':
            return { id, type, data: { text: '' } };
        case 'quote':
            return { id, type, data: { text: '', cite: '' } };
        case 'list':
            return { id, type, data: { ordered: false, items: [''] } };
        case 'image':
            return { id, type, data: { src: '', alt: '', caption: '' } };
        case 'code':
            return { id, type, data: { code: '', language: '' } };
        case 'divider':
            return { id, type, data: {} };
        case 'cta':
            return {
                id,
                type,
                data: {
                    heading: '',
                    text: '',
                    button_label: '',
                    button_url: '',
                },
            };
    }
}

// The editor for the body of an entry. Blocks can be reordered, removed, and given new content in place.
// Validation errors come back keyed by block: body.{index}.{field}, or body.{index} for the block as a whole.
// Each block shows its own errors under its fields.
export default function BlockEditor({
    blocks,
    onChange,
    ctas,
    uploadEndpoint,
    onError,
    errors = {},
}: {
    blocks: ContentBlock[];
    onChange: (blocks: ContentBlock[]) => void;
    ctas: CtaOption[];
    uploadEndpoint: string;
    onError: (message: string) => void;
    errors?: Record<string, string>;
}) {
    const t = useTrans();

    // The messages for one block, in the order the server reported them.
    const blockErrors = (index: number): string[] =>
        Object.entries(errors)
            .filter(
                ([key]) =>
                    key === `body.${index}` || key.startsWith(`body.${index}.`),
            )
            .map(([, message]) => message);

    const update = (index: number, data: Record<string, unknown>) => {
        onChange(
            blocks.map((block, i) =>
                i === index
                    ? ({
                          ...block,
                          data: { ...block.data, ...data },
                      } as ContentBlock)
                    : block,
            ),
        );
    };

    const move = (index: number, by: number) => {
        const target = index + by;

        if (target < 0 || target >= blocks.length) {
            return;
        }

        const next = [...blocks];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    const remove = (index: number) =>
        onChange(blocks.filter((_, i) => i !== index));

    return (
        <div className="flex flex-col gap-4">
            {blocks.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    {t('No content yet. Add a block below.')}
                </p>
            )}

            {blocks.map((block, index) => (
                <div
                    key={block.id}
                    className="flex flex-col gap-3 rounded-lg border p-4"
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                            {blockLabel(block.type, t)}
                        </span>
                        <div className="flex gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t('Move up')}
                                onClick={() => move(index, -1)}
                                disabled={index === 0}
                            >
                                <ArrowUp />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t('Move down')}
                                onClick={() => move(index, 1)}
                                disabled={index === blocks.length - 1}
                            >
                                <ArrowDown />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t('Remove block')}
                                onClick={() => remove(index)}
                            >
                                <Trash2 />
                            </Button>
                        </div>
                    </div>

                    <BlockFields
                        block={block}
                        onUpdate={(data) => update(index, data)}
                        ctas={ctas}
                        uploadEndpoint={uploadEndpoint}
                        onError={onError}
                    />

                    {blockErrors(index).map((message) => (
                        <p
                            key={message}
                            role="alert"
                            className="text-sm text-destructive"
                        >
                            {message}
                        </p>
                    ))}
                </div>
            ))}

            <AddBlock onAdd={(type) => onChange([...blocks, newBlock(type)])} />
        </div>
    );
}

function AddBlock({ onAdd }: { onAdd: (type: BlockType) => void }) {
    const t = useTrans();
    const id = useId();

    return (
        <div className="flex flex-wrap items-end gap-2">
            <div className="grid gap-2">
                <Label htmlFor={id}>{t('Add a block')}</Label>
                <NativeSelect
                    id={id}
                    value=""
                    onChange={(event) => {
                        if (event.target.value) {
                            onAdd(event.target.value as BlockType);
                        }
                    }}
                >
                    <NativeSelectOption value="">
                        {t('Choose a block type')}
                    </NativeSelectOption>
                    {BLOCK_TYPES.map((type) => (
                        <NativeSelectOption key={type} value={type}>
                            {blockLabel(type, t)}
                        </NativeSelectOption>
                    ))}
                </NativeSelect>
            </div>
        </div>
    );
}

function BlockFields({
    block,
    onUpdate,
    ctas,
    uploadEndpoint,
    onError,
}: {
    block: ContentBlock;
    onUpdate: (data: Record<string, unknown>) => void;
    ctas: CtaOption[];
    uploadEndpoint: string;
    onError: (message: string) => void;
}) {
    const t = useTrans();
    const id = useId();

    switch (block.type) {
        case 'heading':
            return (
                <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                    <div className="grid gap-2">
                        <Label htmlFor={`${id}-text`}>{t('Heading')}</Label>
                        <Input
                            id={`${id}-text`}
                            maxLength={200}
                            value={block.data.text}
                            onChange={(e) => onUpdate({ text: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${id}-level`}>{t('Level')}</Label>
                        <NativeSelect
                            id={`${id}-level`}
                            value={block.data.level}
                            onChange={(e) =>
                                onUpdate({ level: Number(e.target.value) })
                            }
                        >
                            <NativeSelectOption value={2}>
                                H2
                            </NativeSelectOption>
                            <NativeSelectOption value={3}>
                                H3
                            </NativeSelectOption>
                        </NativeSelect>
                    </div>
                </div>
            );

        case 'paragraph':
            return (
                <TextField
                    id={id}
                    label={t('Text')}
                    value={block.data.text}
                    max={5000}
                    onChange={(text) => onUpdate({ text })}
                />
            );

        case 'quote':
            return (
                <>
                    <TextField
                        id={id}
                        label={t('Quote')}
                        value={block.data.text}
                        max={1000}
                        onChange={(text) => onUpdate({ text })}
                    />
                    <TextField
                        id={`${id}-cite`}
                        label={t('Source (optional)')}
                        value={block.data.cite ?? ''}
                        max={160}
                        onChange={(cite) => onUpdate({ cite })}
                    />
                </>
            );

        case 'list':
            return (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor={id}>{t('Items (one per line)')}</Label>
                        <Textarea
                            id={id}
                            rows={4}
                            value={block.data.items.join('\n')}
                            onChange={(e) =>
                                onUpdate({
                                    items: e.target.value
                                        .split('\n')
                                        .slice(0, 50),
                                })
                            }
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={block.data.ordered}
                            onChange={(e) =>
                                onUpdate({ ordered: e.target.checked })
                            }
                        />
                        {t('Numbered list')}
                    </label>
                </>
            );

        case 'image':
            return (
                <>
                    <ImageField
                        endpoint={uploadEndpoint}
                        label={t('Image')}
                        value={block.data.src}
                        onChange={(src) => onUpdate({ src })}
                        onError={onError}
                    />
                    <TextField
                        id={`${id}-alt`}
                        label={t('Alternative text')}
                        value={block.data.alt ?? ''}
                        max={200}
                        onChange={(alt) => onUpdate({ alt })}
                    />
                    <TextField
                        id={`${id}-caption`}
                        label={t('Caption (optional)')}
                        value={block.data.caption ?? ''}
                        max={200}
                        onChange={(caption) => onUpdate({ caption })}
                    />
                </>
            );

        case 'code':
            return (
                <>
                    <TextField
                        id={`${id}-language`}
                        label={t('Language (optional)')}
                        value={block.data.language ?? ''}
                        max={30}
                        onChange={(language) => onUpdate({ language })}
                    />
                    <div className="grid gap-2">
                        <Label htmlFor={id}>{t('Code')}</Label>
                        <Textarea
                            id={id}
                            rows={6}
                            className="font-mono text-sm"
                            value={block.data.code}
                            onChange={(e) => onUpdate({ code: e.target.value })}
                        />
                    </div>
                </>
            );

        case 'divider':
            return (
                <p className="text-sm text-muted-foreground">
                    {t('A horizontal line. Nothing to fill in.')}
                </p>
            );

        case 'cta':
            return (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor={id}>{t('Saved call to action')}</Label>
                        <NativeSelect
                            id={id}
                            value={block.data.cta_id ?? ''}
                            onChange={(e) =>
                                onUpdate({
                                    cta_id: e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                })
                            }
                        >
                            <NativeSelectOption value="">
                                {t('Write it here')}
                            </NativeSelectOption>
                            {ctas.map((cta) => (
                                <NativeSelectOption key={cta.id} value={cta.id}>
                                    {cta.name}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                        <p className="text-xs text-muted-foreground">
                            {t(
                                'A saved call to action updates everywhere it is used.',
                            )}
                        </p>
                    </div>
                    {!block.data.cta_id && (
                        <>
                            <TextField
                                id={`${id}-heading`}
                                label={t('Heading')}
                                value={block.data.heading ?? ''}
                                max={160}
                                onChange={(heading) => onUpdate({ heading })}
                            />
                            <TextField
                                id={`${id}-text`}
                                label={t('Text')}
                                value={block.data.text ?? ''}
                                max={300}
                                onChange={(text) => onUpdate({ text })}
                            />
                            <TextField
                                id={`${id}-button`}
                                label={t('Button label')}
                                value={block.data.button_label ?? ''}
                                max={40}
                                onChange={(button_label) =>
                                    onUpdate({ button_label })
                                }
                            />
                            <TextField
                                id={`${id}-url`}
                                label={t('Button link')}
                                value={block.data.button_url ?? ''}
                                max={500}
                                onChange={(button_url) =>
                                    onUpdate({ button_url })
                                }
                            />
                        </>
                    )}
                </>
            );
    }
}

function TextField({
    id,
    label,
    value,
    max,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    max: number;
    onChange: (value: string) => void;
}) {
    const multiline = max > 200;

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            {multiline ? (
                <Textarea
                    id={id}
                    rows={4}
                    maxLength={max}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            ) : (
                <Input
                    id={id}
                    maxLength={max}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}
        </div>
    );
}

function blockLabel(type: BlockType, t: (key: string) => string): string {
    const labels: Record<BlockType, string> = {
        heading: t('Heading'),
        paragraph: t('Paragraph'),
        quote: t('Quote'),
        list: t('List'),
        image: t('Image'),
        code: t('Code'),
        divider: t('Divider'),
        cta: t('Call to action'),
    };

    return labels[type];
}
