import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useTrans } from '@/hooks/use-trans';

// One upload field for images. Each feature passes its own upload endpoint (landing and CMS keep separate
// permissions), and the endpoint returns { url }. Only PNG, JPEG and WebP are accepted.
export function ImageField({
    label,
    endpoint,
    value = '',
    onChange,
    onError,
}: {
    label: string;
    endpoint: string;
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
            const response = await fetch(endpoint, {
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

function csrfToken(): string {
    const cookie = document.cookie
        .split('; ')
        .find((item) => item.startsWith('XSRF-TOKEN='));

    return cookie ? decodeURIComponent(cookie.split('=')[1] ?? '') : '';
}
