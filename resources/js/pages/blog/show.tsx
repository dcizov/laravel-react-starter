import { Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ThemeShell } from '@/components/themes/theme-shell';
import type { ThemePageProps } from '@/components/themes/theme-shell';

type Block = { type: string; text: string };

type Props = ThemePageProps & {
    post: {
        id: number;
        title: string;
        slug: string;
        excerpt: string | null;
        body: string;
        blocks: Block[];
        url: string;
        published_label: string | null;
        reading_minutes: number;
        author: string | null;
        category: { name: string; slug: string } | null;
        tags: string[];
        meta_description: string | null;
        image: {
            url: string;
            thumbnail_url: string | null;
            alt: string;
            width: number | null;
            height: number | null;
        } | null;
    };
    related: {
        id: number;
        title: string;
        url: string;
        published_label: string | null;
    }[];
};

export default function BlogShow({ site, menus, theme, post, related }: Props) {
    return (
        <>
            <Head title={`${post.title} — ${site.name}`}>
                <meta
                    name="description"
                    content={post.meta_description ?? site.description}
                />
                <meta property="og:type" content="article" />
                <meta property="og:title" content={post.title} />
            </Head>

            <ThemeShell site={site} menus={menus} theme={theme} variant="wide">
                <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
                    <a
                        href="/blog"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-3.5" />
                        All posts
                    </a>

                    <p className="mt-6 text-[11px] tracking-wide text-muted-foreground uppercase">
                        {post.category?.name ?? 'Journal'} ·{' '}
                        {post.published_label ?? ''} · {post.reading_minutes}{' '}
                        min read
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                        {post.title}
                    </h1>

                    {post.author ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                            By {post.author}
                        </p>
                    ) : null}

                    {post.image ? (
                        <img
                            src={post.image.url}
                            alt={post.image.alt}
                            width={post.image.width ?? undefined}
                            height={post.image.height ?? undefined}
                            className="mt-8 aspect-[16/9] w-full rounded-lg object-cover"
                        />
                    ) : null}

                    <div className="mt-8 space-y-5">
                        {post.blocks.map((block, position) => {
                            // Body blocks carry no ids; their order is the identity.
                            const key = `${block.type}-${position}`;

                            if (block.type === 'heading') {
                                return (
                                    <h2
                                        key={key}
                                        className="pt-4 text-xl font-semibold tracking-tight"
                                    >
                                        {block.text}
                                    </h2>
                                );
                            }

                            if (block.type === 'quote') {
                                return (
                                    <blockquote
                                        key={key}
                                        className="border-l-2 pl-4 text-lg text-balance italic"
                                        style={{
                                            borderColor: theme.tokens.accent,
                                        }}
                                    >
                                        {block.text}
                                    </blockquote>
                                );
                            }

                            return (
                                <p
                                    key={key}
                                    className="leading-relaxed whitespace-pre-line text-muted-foreground"
                                >
                                    {block.text}
                                </p>
                            );
                        })}
                    </div>

                    {post.tags.length > 0 ? (
                        <div className="mt-10 flex flex-wrap gap-1.5">
                            {post.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    ) : null}
                </article>

                {related.length > 0 ? (
                    <div className="border-t border-border/60 bg-muted/40">
                        <div className="mx-auto w-full max-w-6xl px-6 py-12">
                            <p className="text-xs font-semibold tracking-wide uppercase">
                                More like this
                            </p>
                            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                                {related.map((item) => (
                                    <li key={item.id}>
                                        <a
                                            href={item.url}
                                            className="text-sm font-medium underline-offset-4 hover:underline"
                                        >
                                            {item.title}
                                        </a>
                                        <p className="text-[11px] text-muted-foreground">
                                            {item.published_label ?? ''}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : null}
            </ThemeShell>
        </>
    );
}
