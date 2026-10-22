import type { ReactNode } from 'react';
import { TITLE_SECTION } from '@/components/landing/block-style';
import type { BlockData, LatestPost } from '@/components/landing/block-types';
import { EditableText } from '@/components/landing/landing-edit';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

// The latest-posts block. The posts come from the server (blog feature); the heading and text are the admin's.
// Layouts: 0 cards in a grid, 1 a list of rows, 2 one featured post with the rest beside it, 3 compact links.
export function PostsBlock({
    data,
    variant,
}: {
    data: BlockData['posts'];
    variant: number;
}) {
    const t = useTrans();
    const posts = (data.posts ?? []).slice(0, data.count);

    return (
        <>
            <div className="flex w-full flex-col gap-3 text-center">
                <EditableText
                    as="h2"
                    path="title"
                    value={data.title}
                    max={120}
                    className={TITLE_SECTION}
                />
                <EditableText
                    as="p"
                    path="text"
                    value={data.text}
                    multiline
                    max={300}
                    className="mx-auto max-w-2xl text-pretty text-muted-foreground"
                />
            </div>

            {posts.length === 0 ? (
                <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    {t(
                        'No published posts yet. They appear here once you publish one.',
                    )}
                </p>
            ) : variant === 1 ? (
                <ul className="flex w-full flex-col divide-y rounded-2xl border">
                    {posts.map((post) => (
                        <li key={post.id}>
                            <PostLink
                                post={post}
                                className="flex flex-col gap-1 p-5 hover:bg-muted/50 @xl:flex-row @xl:items-center @xl:justify-between"
                            >
                                <span className="font-medium">
                                    {post.title}
                                </span>
                                <PostDate post={post} />
                            </PostLink>
                        </li>
                    ))}
                </ul>
            ) : variant === 2 ? (
                <div className="grid w-full gap-6 @2xl:grid-cols-2">
                    <PostCard post={posts[0]} large />
                    {posts.length > 1 && (
                        <ul className="flex flex-col gap-4">
                            {posts.slice(1).map((post) => (
                                <li key={post.id}>
                                    <PostLink
                                        post={post}
                                        className="flex flex-col gap-1 rounded-2xl border p-4 hover:bg-muted/50"
                                    >
                                        <span className="font-medium">
                                            {post.title}
                                        </span>
                                        <PostDate post={post} />
                                    </PostLink>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : variant === 3 ? (
                <ul className="flex w-full flex-wrap justify-center gap-x-8 gap-y-3">
                    {posts.map((post) => (
                        <li key={post.id}>
                            <PostLink
                                post={post}
                                className="text-sm font-medium underline-offset-4 hover:underline"
                            >
                                {post.title}
                            </PostLink>
                        </li>
                    ))}
                </ul>
            ) : (
                <div
                    className={cn(
                        'grid w-full gap-6',
                        posts.length > 1
                            ? '@xl:grid-cols-2 @4xl:grid-cols-3'
                            : '',
                    )}
                >
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </>
    );
}

function PostCard({
    post,
    large = false,
}: {
    post: LatestPost;
    large?: boolean;
}) {
    return (
        <PostLink
            post={post}
            className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card hover:shadow-md"
        >
            {post.featuredImage && (
                <img
                    src={post.featuredImage}
                    alt=""
                    loading="lazy"
                    className={cn(
                        'w-full object-cover',
                        large ? 'aspect-video' : 'aspect-[4/3]',
                    )}
                />
            )}
            <div
                className={cn(
                    'flex flex-1 flex-col gap-2 p-6',
                    large && 'gap-3 p-8',
                )}
            >
                <PostDate post={post} />
                <span
                    className={cn(
                        'font-medium',
                        large ? 'text-2xl' : 'text-lg',
                    )}
                >
                    {post.title}
                </span>
                {post.excerpt && (
                    <span className="line-clamp-3 text-sm text-muted-foreground">
                        {post.excerpt}
                    </span>
                )}
            </div>
        </PostLink>
    );
}

function PostLink({
    post,
    className,
    children,
}: {
    post: LatestPost;
    className?: string;
    children: ReactNode;
}) {
    return (
        <a href={post.url} className={cn('block transition-colors', className)}>
            {children}
        </a>
    );
}

function PostDate({ post }: { post: LatestPost }) {
    if (!post.publishedAt) {
        return null;
    }

    return (
        <time
            dateTime={post.publishedAt}
            className="text-xs text-muted-foreground"
        >
            {new Date(post.publishedAt).toLocaleDateString(undefined, {
                dateStyle: 'medium',
            })}
        </time>
    );
}
