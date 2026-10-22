import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { FileText, Globe, Mail, MessageSquare, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

// What the server sends for the overview. A card is missing when the user may not see its data or its feature is off.
export type SiteOverview = {
    site: { name: string; isDefault: boolean };
    content?: {
        types: { key: string; label: string; singularLabel: string }[];
        published: number;
        drafts: number;
        scheduled: number;
        trashed: number;
        canCreate: boolean;
    };
    comments?: { pending: number };
    newsletter?: { subscribed: number };
    seo?: { indexing: boolean; withoutDescription: number };
    sites?: { count: number; default: string | null };
};

// The cards that show what the admin can see on the site. Each one links to the page where the numbers are changed.
export function SiteOverviewCards({ overview }: { overview: SiteOverview }) {
    const t = useTrans();
    const cards: { key: string; node: React.ReactNode }[] = [];

    if (overview.content) {
        const content = overview.content;
        const empty =
            content.published === 0 &&
            content.drafts === 0 &&
            content.scheduled === 0;

        cards.push({
            key: 'content',
            node: (
                <OverviewCard
                    title={t('Content')}
                    icon={FileText}
                    description={t('On :site', { site: overview.site.name })}
                    footer={content.types.map((type) => (
                        <Link
                            key={type.key}
                            className={buttonVariants({
                                variant: 'outline',
                                size: 'sm',
                            })}
                            href={`/admin/content/${type.key}`}
                        >
                            {type.label}
                        </Link>
                    ))}
                >
                    {empty ? (
                        <div className="flex flex-col gap-2">
                            <p className="text-sm text-muted-foreground">
                                {t('No content yet.')}
                            </p>
                            {content.canCreate && content.types[0] && (
                                <Link
                                    className={buttonVariants({ size: 'sm' })}
                                    href={`/admin/content/${content.types[0].key}/create`}
                                >
                                    {t('New :type', {
                                        type: content.types[0].singularLabel,
                                    })}
                                </Link>
                            )}
                        </div>
                    ) : (
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                            <Stat
                                label={t('Published')}
                                value={content.published}
                            />
                            <Stat label={t('Drafts')} value={content.drafts} />
                            <Stat
                                label={t('Scheduled')}
                                value={content.scheduled}
                            />
                            <Stat
                                label={t('In trash')}
                                value={content.trashed}
                            />
                        </dl>
                    )}
                </OverviewCard>
            ),
        });
    }

    if (overview.comments) {
        cards.push({
            key: 'comments',
            node: (
                <OverviewCard
                    title={t('Comments')}
                    icon={MessageSquare}
                    description={t('Waiting for approval')}
                    footer={
                        <Link
                            className={buttonVariants({
                                variant: 'outline',
                                size: 'sm',
                            })}
                            href="/admin/blog/comments?status=pending"
                        >
                            {t('Review comments')}
                        </Link>
                    }
                >
                    {overview.comments.pending === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {t('No comments are waiting.')}
                        </p>
                    ) : (
                        <p className="text-2xl font-semibold tabular-nums">
                            {overview.comments.pending}
                        </p>
                    )}
                </OverviewCard>
            ),
        });
    }

    if (overview.newsletter) {
        cards.push({
            key: 'newsletter',
            node: (
                <OverviewCard
                    title={t('Newsletter')}
                    icon={Mail}
                    description={t('Subscribed people')}
                    footer={
                        <Link
                            className={buttonVariants({
                                variant: 'outline',
                                size: 'sm',
                            })}
                            href="/admin/newsletter"
                        >
                            {t('Subscribers')}
                        </Link>
                    }
                >
                    {overview.newsletter.subscribed === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {t('No one has subscribed yet.')}
                        </p>
                    ) : (
                        <p className="text-2xl font-semibold tabular-nums">
                            {overview.newsletter.subscribed}
                        </p>
                    )}
                </OverviewCard>
            ),
        });
    }

    if (overview.seo) {
        cards.push({
            key: 'seo',
            node: (
                <OverviewCard
                    title={t('Search and sharing')}
                    icon={Search}
                    description={
                        overview.seo.indexing
                            ? t('Search engines may index the site.')
                            : t('Search engines are asked to stay away.')
                    }
                    footer={
                        <Link
                            className={buttonVariants({
                                variant: 'outline',
                                size: 'sm',
                            })}
                            href="/admin/seo"
                        >
                            {t('Search settings')}
                        </Link>
                    }
                >
                    <div className="flex flex-col gap-2 text-sm">
                        <Badge
                            variant={
                                overview.seo.indexing ? 'default' : 'secondary'
                            }
                            className="w-fit"
                        >
                            {overview.seo.indexing
                                ? t('Indexing on')
                                : t('Indexing off')}
                        </Badge>
                        <span className="text-muted-foreground">
                            {overview.seo.withoutDescription === 0
                                ? t('Every live page has a search description.')
                                : t(
                                      ':count live pages have no search description.',
                                      {
                                          count: overview.seo
                                              .withoutDescription,
                                      },
                                  )}
                        </span>
                    </div>
                </OverviewCard>
            ),
        });
    }

    if (overview.sites) {
        cards.push({
            key: 'sites',
            node: (
                <OverviewCard
                    title={t('Sites')}
                    icon={Globe}
                    description={t('Default: :name', {
                        name: overview.sites.default ?? '—',
                    })}
                    footer={
                        <Link
                            className={buttonVariants({
                                variant: 'outline',
                                size: 'sm',
                            })}
                            href="/admin/sites"
                        >
                            {t('Manage sites')}
                        </Link>
                    }
                >
                    <p className="text-2xl font-semibold tabular-nums">
                        {overview.sites.count}
                    </p>
                </OverviewCard>
            ),
        });
    }

    if (cards.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('Nothing to show yet')}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    {t(
                        'Cards appear here for the areas your role can manage. Ask an administrator for access to see more.',
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div
            className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4"
            aria-label={t('Site overview')}
        >
            {cards.map((card) => (
                <div key={card.key}>{card.node}</div>
            ))}
        </div>
    );
}

// What to show while the overview is still being counted on the server.
export function SiteOverviewSkeleton() {
    const t = useTrans();

    return (
        <div
            className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4"
            role="status"
            aria-live="polite"
        >
            <span className="sr-only">{t('Loading the site overview…')}</span>
            {[0, 1, 2].map((item) => (
                <Card key={item} aria-hidden="true">
                    <CardHeader>
                        <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function OverviewCard({
    title,
    icon: Icon,
    description,
    footer,
    children,
}: {
    title: string;
    icon: LucideIcon;
    description: string;
    footer: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <Card className={cn('h-full')}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <div className="flex flex-col gap-1">
                    <CardTitle className="text-sm font-medium">
                        {title}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                        {description}
                    </span>
                </div>
                <Icon
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                />
            </CardHeader>
            <CardContent>{children}</CardContent>
            <CardFooter className="flex flex-wrap gap-2">{footer}</CardFooter>
        </Card>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{value}</dd>
        </div>
    );
}
