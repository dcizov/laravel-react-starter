import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Tag as TagIcon } from 'lucide-react';
import { useState } from 'react';
import { useBreadcrumbs } from '@/components/breadcrumbs-context';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

type Term = {
    id: number;
    name: string;
    slug: string;
    posts: number;
    urls: { update: string; destroy: string };
};

type Props = {
    categories: Term[];
    tags: Term[];
    urls: { categories: string; tags: string; posts: string };
    can: { update: boolean };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Content', href: '/admin/posts' },
    { title: 'Posts', href: '/admin/posts' },
    { title: 'Categories & tags', href: '/admin/posts/taxonomy' },
];

/**
 * Categories and tags are the same shape, so one screen drives both lists.
 */
export default function Taxonomy({ categories, tags, urls, can }: Props) {
    useBreadcrumbs(breadcrumbs);

    return (
        <>
            <Head title="Categories & tags" />

            <div className="space-y-5">
                <PageHeader
                    title="Categories & tags"
                    description="Categories are for structure; tags are for themes that cut across it."
                    actions={
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={urls.posts}>
                                <ArrowLeft className="size-4" />
                                Posts
                            </Link>
                        </Button>
                    }
                />

                <div className="grid gap-5 lg:grid-cols-2">
                    <TermList
                        title="Categories"
                        terms={categories}
                        label="New category"
                        canEdit={can.update}
                        createUrl={urls.categories}
                    />
                    <TermList
                        title="Tags"
                        terms={tags}
                        label="New tag"
                        canEdit={can.update}
                        createUrl={urls.tags}
                    />
                </div>
            </div>
        </>
    );
}

function TermList({
    title,
    terms,
    label,
    canEdit,
    createUrl,
}: {
    title: string;
    terms: Term[];
    label: string;
    canEdit: boolean;
    createUrl: string;
}) {
    const [name, setName] = useState('');
    const [editing, setEditing] = useState<number | null>(null);
    const [draft, setDraft] = useState('');
    const [pendingDelete, setPendingDelete] = useState<Term | null>(null);

    const create = () => {
        router.post(
            createUrl,
            { name },
            { preserveScroll: true, onSuccess: () => setName('') },
        );
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {canEdit ? (
                    <div className="flex items-center gap-2">
                        <Input
                            value={name}
                            placeholder={label}
                            onChange={(event) => setName(event.target.value)}
                            onKeyDown={(event) => {
                                if (
                                    event.key === 'Enter' &&
                                    name.trim() !== ''
                                ) {
                                    create();
                                }
                            }}
                        />
                        <Button
                            size="sm"
                            onClick={create}
                            disabled={name.trim() === ''}
                        >
                            <Plus className="size-3.5" />
                            Add
                        </Button>
                    </div>
                ) : null}

                {terms.length === 0 ? (
                    <p className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
                        <TagIcon className="size-3.5" />
                        Nothing here yet.
                    </p>
                ) : (
                    <ul className="divide-y divide-border/60">
                        {terms.map((term) => (
                            <li
                                key={term.id}
                                className="flex items-center gap-2 py-2"
                            >
                                {editing === term.id ? (
                                    <>
                                        <Input
                                            value={draft}
                                            className="h-8"
                                            onChange={(event) =>
                                                setDraft(event.target.value)
                                            }
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    router.patch(
                                                        term.urls.update,
                                                        { name: draft },
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: () =>
                                                                setEditing(
                                                                    null,
                                                                ),
                                                        },
                                                    );
                                                }
                                            }}
                                        />
                                        <Button
                                            size="sm"
                                            className="h-7"
                                            onClick={() =>
                                                router.patch(
                                                    term.urls.update,
                                                    { name: draft },
                                                    {
                                                        preserveScroll: true,
                                                        onSuccess: () =>
                                                            setEditing(null),
                                                    },
                                                )
                                            }
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7"
                                            onClick={() => setEditing(null)}
                                        >
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <span className="min-w-0 flex-1 truncate text-sm">
                                            {term.name}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            {term.posts} posts
                                        </span>
                                        {canEdit ? (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7"
                                                    onClick={() => {
                                                        setEditing(term.id);
                                                        setDraft(term.name);
                                                    }}
                                                >
                                                    Rename
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-status-error"
                                                    onClick={() =>
                                                        setPendingDelete(term)
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </>
                                        ) : null}
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                <ConfirmDialog
                    open={pendingDelete !== null}
                    onOpenChange={(open) =>
                        open ? null : setPendingDelete(null)
                    }
                    title={`Delete “${pendingDelete?.name ?? ''}”?`}
                    description={
                        pendingDelete && pendingDelete.posts > 0
                            ? `It is used by ${pendingDelete.posts} post${pendingDelete.posts === 1 ? '' : 's'}; those keep their content and lose this term.`
                            : 'No post uses it. This cannot be undone.'
                    }
                    confirmLabel="Delete term"
                    onConfirm={() => {
                        if (pendingDelete) {
                            router.delete(pendingDelete.urls.destroy, {
                                preserveScroll: true,
                            });
                        }
                        setPendingDelete(null);
                    }}
                />
            </CardContent>
        </Card>
    );
}
