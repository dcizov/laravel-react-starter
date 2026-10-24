import { Head } from '@inertiajs/react';
import { Rss } from 'lucide-react';
import { ThemeBand, ThemeShell } from '@/components/themes/theme-shell';
import type { ThemePageProps } from '@/components/themes/theme-shell';
import { cn } from '@/lib/utils';

type PostCard = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    url: string;
    published_label: string | null;
    category: { name: string; slug: string } | null;
};

type Props = ThemePageProps & {
    posts: { data: PostCard[]; total: number; links: { url: string | null; label: string; active: boolean }[] };
    categories: { id: number; name: string; slug: string; posts_count: number }[];
    tags: { id: number; name: string; slug: string; posts_count: number }[];
    feed_url: string;
};

/** Laravel paginator labels arrive HTML-escaped (`&laquo; Previous`). */
function plainLabel(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&amp;/g, '&');
}

/**
 * The public blog index. PostCraft ships the layout, the active theme supplies
 * the chrome and the tokens — a blog should not look like a different site.
 */
export default function BlogIndex({ site, menus, theme, posts, categories, feed_url }: Props) {
    return (
        <>
            <Head title={`Journal — ${site.name}`}>
                <meta name="description" content={site.description} />
            </Head>

            <ThemeShell site={site} menus={menus} theme={theme} variant="wide">
                <ThemeBand>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="max-w-2xl space-y-2">
                            <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">Journal</p>
                            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                                Notes from the studio
                            </h1>
                            <p className="text-muted-foreground">{site.tagline}</p>
                        </div>
                        <a href={feed_url} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs">
                            <Rss className="size-3.5" />
                            RSS
                        </a>
                    </div>
                </ThemeBand>

                <ThemeBand tone="muted">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_200px]">
                        {posts.data.length === 0 ? (
                            <p className="text-muted-foreground py-16 text-sm">Nothing published yet.</p>
                        ) : (
                            <div className="space-y-8">
                                {posts.data.map((post) => (
                                    <article key={post.id} className="border-b border-border/60 pb-6 last:border-0">
                                        <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
                                            {post.category?.name ?? 'Journal'} · {post.published_label ?? ''}
                                        </p>
                                        <h2 className="mt-1.5 text-xl font-semibold tracking-tight">
                                            <a href={post.url} className="underline-offset-4 hover:underline">
                                                {post.title}
                                            </a>
                                        </h2>
                                        {post.excerpt ? (
                                            <p className="text-muted-foreground mt-2 max-w-2xl text-sm">{post.excerpt}</p>
                                        ) : null}
                                        <a href={post.url} className="mt-3 inline-block text-xs font-medium underline-offset-4 hover:underline">
                                            Read the post
                                        </a>
                                    </article>
                                ))}

                                {posts.links.length > 3 ? (
                                    <nav className="flex flex-wrap gap-1" aria-label="Pagination">
                                        {posts.links.map((link, slot) =>
                                            link.url ? (
                                                <a
                                                    key={link.url}
                                                    href={link.url}
                                                    className={cn(
                                                        'rounded-md px-2.5 py-1 text-xs',
                                                        link.active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                                                    )}
                                                >
                                                    {plainLabel(link.label)}
                                                </a>
                                            ) : (
                                                // Disabled gap links share a label, so position is the key.
                                                // eslint-disable-next-line @eslint-react/no-array-index-key
                                                <span key={`gap-${slot}`} className="text-muted-foreground px-2.5 py-1 text-xs">
                                                    {plainLabel(link.label)}
                                                </span>
                                            ),
                                        )}
                                    </nav>
                                ) : null}
                            </div>
                        )}

                        <aside className="space-y-4 text-sm">
                            <div>
                                <p className="text-xs font-semibold tracking-wide uppercase">Categories</p>
                                <ul className="text-muted-foreground mt-1.5 space-y-1 text-xs">
                                    {categories.length === 0 ? <li>None yet</li> : null}
                                    {categories.map((category) => (
                                        <li key={category.id} className="flex justify-between gap-2">
                                            <span>{category.name}</span>
                                            <span>{category.posts_count}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </aside>
                    </div>
                </ThemeBand>
            </ThemeShell>
        </>
    );
}
