import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { ImageField } from '@/components/image-field';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTrans } from '@/hooks/use-trans';

type Props = {
    seo: {
        siteName: string;
        description: string | null;
        image: string | null;
        allowIndexing: boolean;
        twitter: string | null;
    };
    sitemapUrl: string;
};

// Site-wide search and sharing settings. Each page can still override its own title and description.
export default function SeoSettings({ seo, sitemapUrl }: Props) {
    const t = useTrans();
    const form = useForm({
        description: seo.description ?? '',
        image: seo.image ?? '',
        allow_indexing: seo.allowIndexing,
        twitter: seo.twitter ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put('/admin/seo', { preserveScroll: true });
    };

    return (
        <>
            <Head title={t('Search and sharing')} />
            <form
                onSubmit={submit}
                className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6"
            >
                <PageHeader
                    title={t('Search and sharing')}
                    description={t(
                        'Defaults for search results and link previews. Pages can override them.',
                    )}
                    actions={
                        <Button type="submit" disabled={form.processing}>
                            {t('Save')}
                        </Button>
                    }
                />

                <section className="flex flex-col gap-4 rounded-xl border p-5">
                    <FieldGroup>
                        <Field>
                            <FieldLabel>{t('Site name')}</FieldLabel>
                            <Input value={seo.siteName} disabled />
                            <FieldDescription>
                                {t('Change it in the general settings.')}
                            </FieldDescription>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="seo-description">
                                {t('Default description')}
                            </FieldLabel>
                            <Textarea
                                id="seo-description"
                                rows={3}
                                maxLength={300}
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                            />
                            <FieldDescription>
                                {t(
                                    'Shown in search results. About 160 characters work best.',
                                )}
                            </FieldDescription>
                            {form.errors.description && (
                                <p className="text-sm text-destructive">
                                    {form.errors.description}
                                </p>
                            )}
                        </Field>
                        <ImageField
                            endpoint="/admin/cms/images"
                            label={t('Default share image')}
                            value={form.data.image}
                            onChange={(url) => form.setData('image', url)}
                            onError={(message) =>
                                form.setError('image', message)
                            }
                        />
                        <Field>
                            <FieldLabel htmlFor="seo-twitter">
                                {t('X / Twitter account (optional)')}
                            </FieldLabel>
                            <Input
                                id="seo-twitter"
                                maxLength={16}
                                placeholder="@name"
                                value={form.data.twitter}
                                onChange={(e) =>
                                    form.setData('twitter', e.target.value)
                                }
                            />
                            {form.errors.twitter && (
                                <p className="text-sm text-destructive">
                                    {form.errors.twitter}
                                </p>
                            )}
                        </Field>
                    </FieldGroup>
                </section>

                <section className="flex flex-col gap-4 rounded-xl border p-5">
                    <label className="flex items-start gap-3 text-sm">
                        <Checkbox
                            checked={form.data.allow_indexing}
                            onCheckedChange={(checked) =>
                                form.setData('allow_indexing', checked === true)
                            }
                        />
                        <span>
                            {t('Allow search engines to index the site')}
                            <span className="block text-muted-foreground">
                                {t(
                                    'When off, every page is marked noindex and the sitemap is not published.',
                                )}
                            </span>
                        </span>
                    </label>
                    <p className="text-sm text-muted-foreground">
                        {t('Sitemap')}:{' '}
                        <a
                            href={sitemapUrl}
                            className="underline"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {sitemapUrl}
                        </a>
                    </p>
                </section>
            </form>
        </>
    );
}
