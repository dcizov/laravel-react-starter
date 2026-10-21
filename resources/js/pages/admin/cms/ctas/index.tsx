import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useTrans } from '@/hooks/use-trans';

type Cta = {
    id: number;
    name: string;
    heading: string;
    text: string | null;
    buttonLabel: string | null;
    buttonUrl: string | null;
};

type Form = {
    name: string;
    heading: string;
    text: string;
    button_label: string;
    button_url: string;
};

// Reusable calls to action. A cta block on any page can point at one of these, so an edit here updates every page.
export default function CmsCtas({ ctas }: { ctas: Cta[] }) {
    const t = useTrans();
    const [editing, setEditing] = useState<Cta | 'new' | null>(null);

    const remove = (cta: Cta) => {
        if (
            window.confirm(
                t(
                    'Delete “:name”? Blocks that use it will keep their last text.',
                    { name: cta.name },
                ),
            )
        ) {
            router.delete(`/admin/cms/ctas/${cta.id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title={t('Calls to action')} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('Calls to action')}
                    description={t(
                        'Write a call to action once and reuse it on any page.',
                    )}
                    actions={
                        <Button size="sm" onClick={() => setEditing('new')}>
                            <Plus /> {t('New call to action')}
                        </Button>
                    }
                />

                <div className="overflow-hidden rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Name')}</TableHead>
                                <TableHead>{t('Heading')}</TableHead>
                                <TableHead>{t('Button')}</TableHead>
                                <TableHead className="text-end">
                                    {t('Actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ctas.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center text-muted-foreground"
                                    >
                                        {t('No calls to action yet.')}
                                    </TableCell>
                                </TableRow>
                            )}
                            {ctas.map((cta) => (
                                <TableRow key={cta.id}>
                                    <TableCell className="font-medium">
                                        {cta.name}
                                    </TableCell>
                                    <TableCell>{cta.heading}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {cta.buttonLabel ?? '–'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label={t('Edit')}
                                                onClick={() => setEditing(cta)}
                                            >
                                                <Pencil />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label={t('Delete')}
                                                onClick={() => remove(cta)}
                                            >
                                                <Trash2 />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {editing && (
                <CtaDialog
                    key={editing === 'new' ? 'new' : editing.id}
                    cta={editing === 'new' ? null : editing}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    );
}

function CtaDialog({ cta, onClose }: { cta: Cta | null; onClose: () => void }) {
    const t = useTrans();
    const form = useForm<Form>({
        name: cta?.name ?? '',
        heading: cta?.heading ?? '',
        text: cta?.text ?? '',
        button_label: cta?.buttonLabel ?? '',
        button_url: cta?.buttonUrl ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => onClose() };

        if (cta) {
            form.put(`/admin/cms/ctas/${cta.id}`, options);
        } else {
            form.post('/admin/cms/ctas', options);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {cta
                            ? t('Edit call to action')
                            : t('New call to action')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <Field
                        id="cta-name"
                        label={t('Name (for you)')}
                        value={form.data.name}
                        error={form.errors.name}
                        max={120}
                        onChange={(v) => form.setData('name', v)}
                    />
                    <Field
                        id="cta-heading"
                        label={t('Heading')}
                        value={form.data.heading}
                        error={form.errors.heading}
                        max={160}
                        onChange={(v) => form.setData('heading', v)}
                    />
                    <div className="grid gap-2">
                        <Label htmlFor="cta-text">{t('Text')}</Label>
                        <Textarea
                            id="cta-text"
                            rows={3}
                            maxLength={300}
                            value={form.data.text}
                            onChange={(e) =>
                                form.setData('text', e.target.value)
                            }
                        />
                        {form.errors.text && (
                            <p className="text-sm text-destructive">
                                {form.errors.text}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            id="cta-button"
                            label={t('Button label')}
                            value={form.data.button_label}
                            error={form.errors.button_label}
                            max={40}
                            onChange={(v) => form.setData('button_label', v)}
                        />
                        <Field
                            id="cta-url"
                            label={t('Button link')}
                            value={form.data.button_url}
                            error={form.errors.button_url}
                            max={500}
                            onChange={(v) => form.setData('button_url', v)}
                            placeholder="https://… or /pages/…"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {t('Save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    id,
    label,
    value,
    error,
    max,
    onChange,
    placeholder,
}: {
    id: string;
    label: string;
    value: string;
    error?: string;
    max: number;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                value={value}
                maxLength={max}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
