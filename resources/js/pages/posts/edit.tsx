import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye, ImagePlus, Rocket, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useBreadcrumbs } from '@/components/breadcrumbs-context';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { MediaPicker } from '@/components/media/media-picker';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { BreadcrumbItem } from '@/types';

type Post = {
    id: number;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    excerpt: string | null;
    body: string;
    category_id: number | null;
    tag_ids: number[];
    published_at_input: string | null;
    featured_media_id: number | null;
    featured_image: {
        id: number;
        url: string;
        thumbnail_url: string | null;
        alt: string | null;
    } | null;
    is_live: boolean;
    urls: {
        update: string;
        publish: string;
        unpublish: string;
        destroy: string;
        public: string | null;
    };
};

type Option = { id: number; name: string };

type Props = {
    post: Post | null;
    categories: Option[];
    tags: Option[];
    urls: { store?: string; update?: string };
    can: { publish: boolean; update?: boolean };
};

export default function PostEditor({
    post,
    categories,
    tags,
    urls,
    can,
}: Props) {
    const isNew = post === null;
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const form = useForm({
        title: post?.title ?? '',
        excerpt: post?.excerpt ?? '',
        body: post?.body ?? '',
        category_id: post?.category_id ?? null,
        tag_ids: post?.tag_ids ?? [],
        published_at: post?.published_at_input ?? '',
        featured_media_id: post?.featured_media_id ?? null,
    });
    const [pickingImage, setPickingImage] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Content', href: '/admin/posts' },
        { title: 'Posts', href: '/admin/posts' },
        { title: isNew ? 'New post' : post.title, href: '#' },
    ];

    const submit = () => {
        if (isNew && urls.store) {
            form.post(urls.store);

            return;
        }

        if (urls.update) {
            form.patch(urls.update, { preserveScroll: true });
        }
    };

    const toggleTag = (id: number, checked: boolean) => {
        form.setData(
            'tag_ids',
            checked
                ? [...form.data.tag_ids, id]
                : form.data.tag_ids.filter((tag) => tag !== id),
        );
    };

    useBreadcrumbs(breadcrumbs);

    return (
        <>
            <Head title={isNew ? 'New post' : `Edit · ${post.title}`} />

            <div className="space-y-5">
                <PageHeader
                    title={isNew ? 'New post' : post.title}
                    description={
                        isNew
                            ? 'Saved as a draft until you publish it.'
                            : `/blog/${post.slug}`
                    }
                    actions={
                        <>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/admin/posts">
                                    <ArrowLeft className="size-4" />
                                    All posts
                                </Link>
                            </Button>
                            {!isNew && post.urls.public ? (
                                <Button variant="outline" size="sm" asChild>
                                    <a
                                        href={post.urls.public}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <Eye className="size-4" />
                                        View
                                    </a>
                                </Button>
                            ) : null}
                            {!isNew && can.publish ? (
                                <Button
                                    variant={
                                        post.is_live ? 'secondary' : 'outline'
                                    }
                                    size="sm"
                                    onClick={() =>
                                        router.post(
                                            post.is_live
                                                ? post.urls.unpublish
                                                : post.urls.publish,
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    <Rocket className="size-4" />
                                    {post.is_live ? 'Unpublish' : 'Publish'}
                                </Button>
                            ) : null}
                            {!isNew && post.urls.destroy ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-status-error"
                                    aria-label="Delete post"
                                    onClick={() => setConfirmingDelete(true)}
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            ) : null}
                            <Button
                                size="sm"
                                onClick={submit}
                                disabled={form.processing}
                            >
                                {isNew ? 'Create draft' : 'Save'}
                            </Button>
                        </>
                    }
                />

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <Card>
                        <CardContent className="space-y-4 p-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="title" className="text-xs">
                                    Title
                                </Label>
                                <Input
                                    id="title"
                                    value={form.data.title}
                                    onChange={(event) =>
                                        form.setData(
                                            'title',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="What did you learn?"
                                    aria-invalid={
                                        form.errors.title ? true : undefined
                                    }
                                />
                                {form.errors.title ? (
                                    <p className="text-xs text-status-error">
                                        {form.errors.title}
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="excerpt" className="text-xs">
                                    Excerpt
                                </Label>
                                <textarea
                                    id="excerpt"
                                    value={form.data.excerpt}
                                    rows={2}
                                    maxLength={300}
                                    onChange={(event) =>
                                        form.setData(
                                            'excerpt',
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Shown on the blog index and in the RSS feed.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="body" className="text-xs">
                                    Body
                                </Label>
                                <textarea
                                    id="body"
                                    value={form.data.body}
                                    rows={18}
                                    onChange={(event) =>
                                        form.setData('body', event.target.value)
                                    }
                                    placeholder={
                                        'Plain text. Blank lines start a paragraph.\n## A heading\n> A pull quote'
                                    }
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed outline-none"
                                    aria-invalid={
                                        form.errors.body ? true : undefined
                                    }
                                />
                                {form.errors.body ? (
                                    <p className="text-xs text-status-error">
                                        {form.errors.body}
                                    </p>
                                ) : null}
                                <p className="text-[11px] text-muted-foreground">
                                    Two newlines separate paragraphs; `## `
                                    starts a heading; `&gt; ` a quote. No HTML
                                    is stored.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">
                                    Publishing
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {!isNew ? (
                                    <StatusBadge
                                        status={
                                            post.is_live ? 'published' : 'draft'
                                        }
                                    />
                                ) : null}

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="published-at"
                                        className="text-xs"
                                    >
                                        Publish date
                                    </Label>
                                    <Input
                                        id="published-at"
                                        type="datetime-local"
                                        value={form.data.published_at}
                                        onChange={(event) =>
                                            form.setData(
                                                'published_at',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        A future date keeps the post off the
                                        blog until then.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">
                                    Featured image
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {form.data.featured_media_id === null ? (
                                    <p className="text-xs text-muted-foreground">
                                        No image. It appears on the blog index
                                        and at the top of the post.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        <img
                                            src={
                                                form.data.featured_media_id ===
                                                post?.featured_image?.id
                                                    ? (post?.featured_image
                                                          ?.thumbnail_url ??
                                                      post?.featured_image?.url)
                                                    : undefined
                                            }
                                            alt={
                                                post?.featured_image?.alt ?? ''
                                            }
                                            className="aspect-[16/9] w-full rounded-md object-cover"
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Alt text lives with the file — edit
                                            it in the media library.
                                        </p>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPickingImage(true)}
                                        disabled={!can.update}
                                    >
                                        <ImagePlus className="size-3.5" />
                                        {form.data.featured_media_id === null
                                            ? 'Choose image'
                                            : 'Change image'}
                                    </Button>
                                    {form.data.featured_media_id !== null ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                form.setData(
                                                    'featured_media_id',
                                                    null,
                                                )
                                            }
                                            disabled={!can.update}
                                        >
                                            Remove
                                        </Button>
                                    ) : null}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">
                                    Category
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select
                                    value={
                                        form.data.category_id === null
                                            ? 'none'
                                            : String(form.data.category_id)
                                    }
                                    onValueChange={(value) =>
                                        form.setData(
                                            'category_id',
                                            value === 'none'
                                                ? null
                                                : Number(value),
                                        )
                                    }
                                >
                                    <SelectTrigger aria-label="Category">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            Uncategorised
                                        </SelectItem>
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category.id}
                                                value={String(category.id)}
                                            >
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Tags</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {tags.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        No tags yet — add some in categories
                                        &amp; tags.
                                    </p>
                                ) : (
                                    tags.map((tag) => (
                                        <label
                                            key={tag.id}
                                            className="flex items-center gap-2 text-xs"
                                        >
                                            <Checkbox
                                                checked={form.data.tag_ids.includes(
                                                    tag.id,
                                                )}
                                                onCheckedChange={(checked) =>
                                                    toggleTag(
                                                        tag.id,
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            {tag.name}
                                        </label>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <MediaPicker
                open={pickingImage}
                onOpenChange={setPickingImage}
                currentUrl={post?.featured_image?.url ?? null}
                onSelect={(item) => {
                    form.setData('featured_media_id', item.id);
                    setPickingImage(false);
                }}
            />
            <ConfirmDialog
                open={confirmingDelete}
                onOpenChange={setConfirmingDelete}
                title={`Delete “${post?.title ?? ''}”?`}
                description="The post and its revision history are removed for good. Unpublish it instead if you only want to take it offline."
                confirmLabel="Delete post"
                onConfirm={() => {
                    if (post) {
                        router.delete(post.urls.destroy);
                    }
                }}
            />
        </>
    );
}
