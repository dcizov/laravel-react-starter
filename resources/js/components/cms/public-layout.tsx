import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useTrans } from '@/hooks/use-trans';
import { addonPageUrl } from '@/lib/addon-pages';
import { dashboard, login } from '@/routes';

// Computed once when the module loads, so rendering stays pure.
const YEAR = new Date().getFullYear();

// The shell for public content pages, posts and archives: site name, a few links, and the content below.
export default function PublicLayout({ children }: { children: ReactNode }) {
    const t = useTrans();
    const { name, auth, features, addons, site } = usePage().props;
    const has = (slug: string) => (features as string[]).includes(slug);
    // The newsletter link exists only while the addon is active; see addonPageUrl.
    const newsletterUrl = addonPageUrl('newsletter::subscribe', addons);
    // Links on a site reached by path start with /s/{slug}. Wayfinder links do not know that, so these are built here.
    const href = (path: string) => `${site.basePath}${path}`;
    // The landing page belongs to the default site. Any other site's home is its own home page.
    const showHome = site.isDefault ? has('landing') : true;

    return (
        <div className="flex min-h-svh flex-col bg-background text-foreground">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 md:px-8">
                <Link href={href('/')} className="font-semibold">
                    {name}
                </Link>
                <nav className="flex flex-wrap items-center gap-4 text-sm">
                    {showHome && (
                        <Link href={href('/')} className="hover:underline">
                            {t('Home')}
                        </Link>
                    )}
                    {has('blog') && (
                        <Link href={href('/blog')} className="hover:underline">
                            {t('Blog')}
                        </Link>
                    )}
                    {newsletterUrl !== null && (
                        <Link href={newsletterUrl} className="hover:underline">
                            {t('Newsletter')}
                        </Link>
                    )}
                    {auth.user ? (
                        <Button
                            variant="outline"
                            size="sm"
                            render={<Link href={dashboard()} />}
                            nativeButton={false}
                        >
                            {t('Dashboard')}
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            render={<Link href={login()} />}
                            nativeButton={false}
                        >
                            {t('Log in')}
                        </Button>
                    )}
                </nav>
            </header>

            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-8">
                {children}
            </main>

            <footer className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
                © {YEAR} {name}
            </footer>
        </div>
    );
}
