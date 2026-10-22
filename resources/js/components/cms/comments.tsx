import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSiteBase } from '@/hooks/use-site-base';
import { useTrans } from '@/hooks/use-trans';

export type PublicComment = {
    id: number;
    author: string;
    body: string;
    createdAt: string | null;
};

// The approved comments of an entry and the form to leave one. Works for any content type that has
// the comments support. Comments wait for approval, so a new one is not shown straight away.
export default function Comments({
    typeKey,
    slug,
    comments,
}: {
    typeKey: string;
    slug: string;
    comments: PublicComment[];
}) {
    const t = useTrans();

    return (
        <section className="mt-12 border-t pt-8">
            <h2 className="mb-4 text-xl font-semibold">
                {t('Comments')} ({comments.length})
            </h2>

            {comments.length === 0 ? (
                <p className="text-muted-foreground">{t('No comments yet.')}</p>
            ) : (
                <ul className="mb-8 flex flex-col gap-4">
                    {comments.map((comment) => (
                        <li key={comment.id} className="rounded-lg border p-4">
                            <p className="text-sm font-medium">
                                {comment.author}
                                {comment.createdAt && (
                                    <span className="ms-2 font-normal text-muted-foreground">
                                        {new Date(
                                            comment.createdAt,
                                        ).toLocaleDateString('de-DE')}
                                    </span>
                                )}
                            </p>
                            <p className="mt-2 whitespace-pre-line">
                                {comment.body}
                            </p>
                        </li>
                    ))}
                </ul>
            )}

            <CommentForm typeKey={typeKey} slug={slug} />
        </section>
    );
}

function CommentForm({ typeKey, slug }: { typeKey: string; slug: string }) {
    const t = useTrans();
    const base = useSiteBase();
    const form = useForm({
        author_name: '',
        author_email: '',
        body: '',
        website: '',
    });

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
                event.preventDefault();
                form.post(`${base}/content/${typeKey}/${slug}/comments`, {
                    preserveScroll: true,
                    onSuccess: () => form.reset('body'),
                });
            }}
        >
            <h3 className="font-semibold">{t('Leave a comment')}</h3>

            {/* Hidden from people; bots tend to fill it in, and the server ignores those submissions. */}
            <div className="hidden" aria-hidden="true">
                <Label htmlFor="website">{t('Website')}</Label>
                <Input
                    id="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.data.website}
                    onChange={(event) =>
                        form.setData('website', event.target.value)
                    }
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="author_name">{t('Name')}</Label>
                    <Input
                        id="author_name"
                        required
                        maxLength={80}
                        value={form.data.author_name}
                        onChange={(event) =>
                            form.setData('author_name', event.target.value)
                        }
                    />
                    {form.errors.author_name && (
                        <p className="text-sm text-destructive">
                            {form.errors.author_name}
                        </p>
                    )}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="author_email">
                        {t('Email (not shown)')}
                    </Label>
                    <Input
                        id="author_email"
                        type="email"
                        maxLength={160}
                        value={form.data.author_email}
                        onChange={(event) =>
                            form.setData('author_email', event.target.value)
                        }
                    />
                    {form.errors.author_email && (
                        <p className="text-sm text-destructive">
                            {form.errors.author_email}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="body">{t('Comment')}</Label>
                <Textarea
                    id="body"
                    required
                    maxLength={2000}
                    rows={4}
                    value={form.data.body}
                    onChange={(event) =>
                        form.setData('body', event.target.value)
                    }
                />
                {form.errors.body && (
                    <p className="text-sm text-destructive">
                        {form.errors.body}
                    </p>
                )}
            </div>

            <div>
                <Button type="submit" disabled={form.processing}>
                    {t('Submit comment')}
                </Button>
            </div>
        </form>
    );
}
