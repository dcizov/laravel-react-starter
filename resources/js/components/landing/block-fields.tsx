import { useState } from 'react';
import { storeImage } from '@/actions/App/Http/Controllers/Admin/LandingController';
import { MAX_FEATURE_ITEMS, MAX_ITEMS } from '@/components/landing/block-types';
import type { LandingBlock } from '@/components/landing/block-types';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTrans } from '@/hooks/use-trans';

// The fields for the selected block. Each change is passed up as the whole block.
export function BlockFields({
    block,
    onChange,
    onError,
}: {
    block: LandingBlock;
    onChange: (block: LandingBlock) => void;
    onError: (message: string) => void;
}) {
    const t = useTrans();

    // Sets one field of the block's data and keeps the rest.
    const set = (patch: Record<string, unknown>) =>
        onChange({
            ...block,
            data: { ...block.data, ...patch },
        } as LandingBlock);

    switch (block.type) {
        case 'hero':
            return (
                <FieldGroup>
                    <TextField
                        id="title"
                        label={t('Headline')}
                        value={block.data.title}
                        max={120}
                        onChange={(value) => set({ title: value })}
                    />
                    <TextField
                        id="text"
                        label={t('Text')}
                        value={block.data.text}
                        max={300}
                        multiline
                        onChange={(value) => set({ text: value })}
                    />
                    <ImageField
                        label={t('Background image')}
                        value={block.data.image}
                        onChange={(value) => set({ image: value })}
                        onError={onError}
                    />
                    <TextField
                        id="button_label"
                        label={t('Button text')}
                        value={block.data.button_label}
                        max={40}
                        onChange={(value) => set({ button_label: value })}
                    />
                    <TextField
                        id="button_url"
                        label={t('Button link')}
                        hint={t('https://… or a path such as /dashboard')}
                        value={block.data.button_url}
                        max={500}
                        onChange={(value) => set({ button_url: value })}
                    />
                </FieldGroup>
            );

        case 'features':
            return (
                <FieldGroup>
                    <TextField
                        id="title"
                        label={t('Section title')}
                        value={block.data.title}
                        max={120}
                        onChange={(value) => set({ title: value })}
                    />
                    {block.data.items.map((item, index) => (
                        <div
                            // Feature items have no id in the saved data, so the position is the key.
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={index}
                            className="flex flex-col gap-2 rounded-md border p-3"
                        >
                            <TextField
                                id={`item-${index}-title`}
                                label={t('Item title')}
                                value={item.title}
                                max={80}
                                onChange={(value) =>
                                    set({
                                        items: block.data.items.map(
                                            (current, i) =>
                                                i === index
                                                    ? {
                                                          ...current,
                                                          title: value,
                                                      }
                                                    : current,
                                        ),
                                    })
                                }
                            />
                            <TextField
                                id={`item-${index}-text`}
                                label={t('Item text')}
                                value={item.text}
                                max={200}
                                multiline
                                onChange={(value) =>
                                    set({
                                        items: block.data.items.map(
                                            (current, i) =>
                                                i === index
                                                    ? {
                                                          ...current,
                                                          text: value,
                                                      }
                                                    : current,
                                        ),
                                    })
                                }
                            />
                            <div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={block.data.items.length <= 1}
                                    onClick={() =>
                                        set({
                                            items: block.data.items.filter(
                                                (_, i) => i !== index,
                                            ),
                                        })
                                    }
                                >
                                    {t('Remove item')}
                                </Button>
                            </div>
                        </div>
                    ))}
                    <div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                                block.data.items.length >= MAX_FEATURE_ITEMS
                            }
                            onClick={() =>
                                set({
                                    items: [
                                        ...block.data.items,
                                        { title: t('New item'), text: '' },
                                    ],
                                })
                            }
                        >
                            {t('Add item')}
                        </Button>
                    </div>
                </FieldGroup>
            );

        case 'text':
            return (
                <FieldGroup>
                    <TextField
                        id="heading"
                        label={t('Heading')}
                        value={block.data.heading}
                        max={120}
                        onChange={(value) => set({ heading: value })}
                    />
                    <TextField
                        id="body"
                        label={t('Text')}
                        hint={t('Blank lines start a new paragraph.')}
                        value={block.data.body}
                        max={2000}
                        multiline
                        rows={6}
                        onChange={(value) => set({ body: value })}
                    />
                </FieldGroup>
            );

        case 'image':
            return (
                <FieldGroup>
                    <ImageField
                        label={t('Image')}
                        value={block.data.src}
                        onChange={(value) => set({ src: value })}
                        onError={onError}
                    />
                    <TextField
                        id="alt"
                        label={t('Description for screen readers')}
                        value={block.data.alt}
                        max={160}
                        onChange={(value) => set({ alt: value })}
                    />
                </FieldGroup>
            );

        case 'button':
            return (
                <FieldGroup>
                    <TextField
                        id="label"
                        label={t('Button text')}
                        value={block.data.label}
                        max={40}
                        onChange={(value) => set({ label: value })}
                    />
                    <TextField
                        id="url"
                        label={t('Button link')}
                        hint={t('https://… or a path such as /dashboard')}
                        value={block.data.url}
                        max={500}
                        onChange={(value) => set({ url: value })}
                    />
                </FieldGroup>
            );
        case 'logos':
            return (
                <FieldGroup>
                    <TextField
                        id="title"
                        label={t('Section title')}
                        value={block.data.title}
                        max={120}
                        onChange={(value) => set({ title: value })}
                    />
                    <ItemList
                        idPrefix={block.id}
                        items={block.data.items}
                        fields={[{ key: 'name', label: t('Name'), max: 60 }]}
                        newItem={{ name: t('Partner') }}
                        max={MAX_ITEMS.logos ?? 12}
                        addLabel={t('Add logo')}
                        onChange={(items) => set({ items })}
                    />
                </FieldGroup>
            );

        case 'stats':
            return (
                <FieldGroup>
                    <TextField
                        id="title"
                        label={t('Section title')}
                        value={block.data.title}
                        max={120}
                        onChange={(value) => set({ title: value })}
                    />
                    <ItemList
                        idPrefix={block.id}
                        items={block.data.items}
                        fields={[
                            {
                                key: 'value',
                                label: t('Number or short text'),
                                max: 20,
                            },
                            { key: 'label', label: t('Label'), max: 60 },
                        ]}
                        newItem={{ value: '0', label: t('Label') }}
                        max={MAX_ITEMS.stats ?? 6}
                        addLabel={t('Add statistic')}
                        onChange={(items) => set({ items })}
                    />
                </FieldGroup>
            );

        case 'testimonials':
            return (
                <FieldGroup>
                    <TextField
                        id="title"
                        label={t('Section title')}
                        value={block.data.title}
                        max={120}
                        onChange={(value) => set({ title: value })}
                    />
                    <ItemList
                        idPrefix={block.id}
                        items={block.data.items}
                        fields={[
                            {
                                key: 'quote',
                                label: t('Quote'),
                                max: 400,
                                multiline: true,
                            },
                            { key: 'name', label: t('Name'), max: 80 },
                            {
                                key: 'role',
                                label: t('Role or company'),
                                max: 80,
                            },
                        ]}
                        newItem={{
                            quote: t('Write a short quote here.'),
                            name: t('Name'),
                        }}
                        max={MAX_ITEMS.testimonials ?? 6}
                        addLabel={t('Add testimonial')}
                        onChange={(items) => set({ items })}
                    />
                </FieldGroup>
            );

        case 'pricing':
            return (
                <FieldGroup>
                    <TextField
                        id="title"
                        label={t('Section title')}
                        value={block.data.title}
                        max={120}
                        onChange={(value) => set({ title: value })}
                    />
                    <ItemList
                        idPrefix={block.id}
                        items={block.data.items}
                        fields={[
                            { key: 'name', label: t('Plan name'), max: 40 },
                            { key: 'price', label: t('Price'), max: 20 },
                            {
                                key: 'period',
                                label: t('Period'),
                                max: 20,
                                hint: t(
                                    'For example /month. Leave blank for a one-off price.',
                                ),
                            },
                            {
                                key: 'description',
                                label: t('Description'),
                                max: 200,
                                multiline: true,
                            },
                            {
                                key: 'features',
                                label: t('Features'),
                                max: 1000,
                                multiline: true,
                                rows: 4,
                                hint: t('One feature per line.'),
                            },
                            {
                                key: 'button_label',
                                label: t('Button text'),
                                max: 40,
                            },
                            {
                                key: 'button_url',
                                label: t('Button link'),
                                max: 500,
                                hint: t(
                                    'https://… or a path such as /register',
                                ),
                            },
                        ]}
                        newItem={{ name: t('Plan'), price: '€0' }}
                        max={MAX_ITEMS.pricing ?? 4}
                        addLabel={t('Add plan')}
                        onChange={(items) => set({ items })}
                    />
                </FieldGroup>
            );

        case 'faq':
            return (
                <FieldGroup>
                    <TextField
                        id="title"
                        label={t('Section title')}
                        value={block.data.title}
                        max={120}
                        onChange={(value) => set({ title: value })}
                    />
                    <ItemList
                        idPrefix={block.id}
                        items={block.data.items}
                        fields={[
                            { key: 'question', label: t('Question'), max: 200 },
                            {
                                key: 'answer',
                                label: t('Answer'),
                                max: 1000,
                                multiline: true,
                            },
                        ]}
                        newItem={{ question: t('Your question?'), answer: '' }}
                        max={MAX_ITEMS.faq ?? 10}
                        addLabel={t('Add question')}
                        onChange={(items) => set({ items })}
                    />
                </FieldGroup>
            );

        case 'cta':
            return (
                <FieldGroup>
                    <TextField
                        id="title"
                        label={t('Heading')}
                        value={block.data.title}
                        max={120}
                        onChange={(value) => set({ title: value })}
                    />
                    <TextField
                        id="text"
                        label={t('Text')}
                        value={block.data.text}
                        max={300}
                        multiline
                        onChange={(value) => set({ text: value })}
                    />
                    <TextField
                        id="button_label"
                        label={t('Button text')}
                        value={block.data.button_label}
                        max={40}
                        onChange={(value) => set({ button_label: value })}
                    />
                    <TextField
                        id="button_url"
                        label={t('Button link')}
                        hint={t('https://… or a path such as /register')}
                        value={block.data.button_url}
                        max={500}
                        onChange={(value) => set({ button_url: value })}
                    />
                </FieldGroup>
            );
    }
}

// A list of items the admin can add to, remove, and edit. Each item has the same fields.
type ListField = {
    key: string;
    label: string;
    max: number;
    multiline?: boolean;
    rows?: number;
    hint?: string;
};
type ListItem = Record<string, string | undefined>;

function ItemList({
    idPrefix,
    items,
    fields,
    newItem,
    max,
    addLabel,
    onChange,
}: {
    idPrefix: string;
    items: ListItem[];
    fields: ListField[];
    newItem: ListItem;
    max: number;
    addLabel: string;
    onChange: (items: ListItem[]) => void;
}) {
    const t = useTrans();

    return (
        <>
            {items.map((item, index) => (
                <div
                    // Items have no id in the saved data, so the position is the key.
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    key={index}
                    className="flex flex-col gap-2 rounded-md border p-3"
                >
                    {fields.map((field) => (
                        <TextField
                            key={field.key}
                            id={`${idPrefix}-${index}-${field.key}`}
                            label={field.label}
                            hint={field.hint}
                            value={item[field.key]}
                            max={field.max}
                            multiline={field.multiline}
                            rows={field.rows}
                            onChange={(value) =>
                                onChange(
                                    items.map((current, i) =>
                                        i === index
                                            ? { ...current, [field.key]: value }
                                            : current,
                                    ),
                                )
                            }
                        />
                    ))}
                    <div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                onChange(items.filter((_, i) => i !== index))
                            }
                        >
                            {t('Remove item')}
                        </Button>
                    </div>
                </div>
            ))}
            <div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={items.length >= max}
                    onClick={() => onChange([...items, { ...newItem }])}
                >
                    {addLabel}
                </Button>
            </div>
        </>
    );
}

function TextField({
    id,
    label,
    hint,
    value = '',
    max,
    multiline = false,
    rows = 3,
    onChange,
}: {
    id: string;
    label: string;
    hint?: string;
    value?: string;
    max: number;
    multiline?: boolean;
    rows?: number;
    onChange: (value: string) => void;
}) {
    const fieldId = `landing-${id}`;

    return (
        <Field>
            <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
            {multiline ? (
                <Textarea
                    id={fieldId}
                    value={value}
                    maxLength={max}
                    rows={rows}
                    onChange={(event) => onChange(event.target.value)}
                />
            ) : (
                <Input
                    id={fieldId}
                    value={value}
                    maxLength={max}
                    onChange={(event) => onChange(event.target.value)}
                />
            )}
            {hint && <FieldDescription>{hint}</FieldDescription>}
        </Field>
    );
}

// Reads the XSRF cookie Laravel sets, so the upload is accepted the same way Inertia's own requests are.
function csrfToken(): string {
    const cookie = document.cookie
        .split('; ')
        .find((item) => item.startsWith('XSRF-TOKEN='));

    return cookie ? decodeURIComponent(cookie.split('=')[1] ?? '') : '';
}

function ImageField({
    label,
    value = '',
    onChange,
    onError,
}: {
    label: string;
    value?: string;
    onChange: (url: string) => void;
    onError: (message: string) => void;
}) {
    const t = useTrans();
    const [uploading, setUploading] = useState(false);

    const upload = async (file: File | undefined) => {
        if (!file) {
            return;
        }

        const body = new FormData();
        body.append('image', file);
        setUploading(true);

        try {
            const response = await fetch(storeImage.url(), {
                method: 'POST',
                body,
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': csrfToken(),
                },
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                onError(
                    data?.errors?.image?.[0] ??
                        t('The image could not be uploaded.'),
                );

                return;
            }

            const data: { url: string } = await response.json();
            onChange(data.url);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Field>
            <FieldLabel>{label}</FieldLabel>
            {value && (
                <img
                    src={value}
                    alt=""
                    className="max-h-32 rounded-md border object-contain"
                />
            )}
            <Input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading}
                onChange={(event) => {
                    void upload(event.target.files?.[0]);
                    event.target.value = '';
                }}
            />
            <FieldDescription>
                {uploading
                    ? t('Uploading…')
                    : t('PNG, JPEG or WebP, up to 2 MB.')}
            </FieldDescription>
            {value && (
                <div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange('')}
                    >
                        {t('Remove image')}
                    </Button>
                </div>
            )}
        </Field>
    );
}
